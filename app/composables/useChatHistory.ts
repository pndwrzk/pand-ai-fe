import type { ChatHistoryApiResponse, ChatHistoryItem } from '~/types/chatHistory'
import { useErrorHandler } from '~/composables/useErrorHandler'

export const useChatHistory = () => {
  const api = useApi();
  const { handleError } = useErrorHandler();
  const history = useState<ChatHistoryItem[]>("chatHistory", () => []);
  const isLoading = useState<boolean>("chatHistoryLoading", () => true);
  const isLoadingMore = useState<boolean>("chatHistoryLoadingMore", () => false);
  const error = useState<string | null>("chatHistoryError", () => null);
  const currentPage = useState<number>("chatHistoryPage", () => 1);
  const perPage = useState<number>("chatHistoryPerPage", () => 10);
  const totalData = useState<number>("chatHistoryTotal", () => 0);

  const hasMore = computed(
    () => history.value.length < totalData.value,
  );

  const refresh = async () => {
    isLoading.value = true;
    error.value = null;
    currentPage.value = 1;

    try {
      const response = await api<ChatHistoryApiResponse>(
        "/conversations/history",
        {
          query: {
            page: 1,
            per_page: perPage.value,
          },
        },
      );
      const items = Array.isArray(response?.data) ? response.data : [];

      history.value = items
        .filter((item) => item?.id)
        .map((item) => ({
          id: String(item.id),
          title: item.title || "Untitled conversation",
          created_at: item.created_at,
          updated_at: item.updated_at,
        }));

      if (response?.meta?.total_data !== undefined) {
        totalData.value = response.meta.total_data;
        console.log('Chat history loaded:', { itemsLoaded: items.length, totalData: response.meta.total_data, hasMore: items.length < response.meta.total_data });
      }

      return history.value;
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
      handleError(err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const loadMore = async () => {
    if (!hasMore.value || isLoadingMore.value) {
      return;
    }

    isLoadingMore.value = true;
    error.value = null;

    try {
      const nextPage = currentPage.value + 1;
      const response = await api<ChatHistoryApiResponse>(
        "/conversations/history",
        {
          query: {
            page: nextPage,
            per_page: perPage.value,
          },
        },
      );
      const items = Array.isArray(response?.data) ? response.data : [];

      const newItems = items
        .filter((item) => item?.id)
        .map((item) => ({
          id: String(item.id),
          title: item.title || "Untitled conversation",
          created_at: item.created_at,
          updated_at: item.updated_at,
        }));

      history.value = [...history.value, ...newItems];
      currentPage.value = nextPage;

      if (response?.meta?.total_data !== undefined) {
        totalData.value = response.meta.total_data;
        console.log('More chat history loaded:', { newItemsLoaded: newItems.length, totalLoaded: history.value.length, totalData: response.meta.total_data, hasMore: history.value.length < response.meta.total_data });
      }
    } catch (err) {
      console.error("Failed to load more chat history:", err);
      handleError(err);
    } finally {
      isLoadingMore.value = false;
    }
  };

  const upsertConversation = (conversationId: string, title: string) => {
    if (!conversationId || !title) {
      return;
    }

    const nextItems = [...history.value];
    const index = nextItems.findIndex((item) => item.id === conversationId);
    const timestamp = new Date().toISOString();

    if (index >= 0) {
      const current = nextItems[index];

      if (!current) {
        return;
      }

      const [existing] = nextItems.splice(index, 1);

      if (existing) {
        nextItems.unshift({
          ...existing,
          title,
          updated_at: timestamp,
        });
      }

      history.value = nextItems;
      return;
    }

    history.value = [
      {
        id: conversationId,
        title,
        created_at: timestamp,
        updated_at: timestamp,
      },
      ...nextItems,
    ];
  };

  return {
    items: computed(() => history.value),
    isLoading: computed(() => isLoading.value),
    isLoadingMore: computed(() => isLoadingMore.value),
    hasMore: hasMore,
    error: computed(() => error.value),
    refresh,
    loadMore,
    upsertConversation,
  };
};
