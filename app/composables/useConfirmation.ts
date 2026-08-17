import type { ConfirmationOptions } from '~/types/confirmation'
import Confirmdialog from '~/components/Confirmdialog.vue'

export const useConfirmation = () => {
  const overlay = useOverlay()

  const requestConfirmation = (options: ConfirmationOptions): Promise<boolean> => {
    const modal = overlay.create(Confirmdialog, {
      destroyOnClose: true,
      props: options
    })

    return modal.open()
  }

  const requestConfirmationAction = (
    options: ConfirmationOptions,
    action: () => Promise<unknown>
  ): Promise<boolean> => {
    const modal = overlay.create(Confirmdialog, {
      destroyOnClose: true,
      props: {
        ...options,
        onConfirmed: async () => {
          await action()
        }
      }
    })

    return modal.open()
  }

  return {
    requestConfirmation,
    requestConfirmationAction
  }
}
