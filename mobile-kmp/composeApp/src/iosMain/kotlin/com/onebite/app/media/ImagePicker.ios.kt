package com.onebite.app.media

import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.addressOf
import kotlinx.cinterop.usePinned
import kotlinx.coroutines.suspendCancellableCoroutine
import platform.Foundation.NSData
import platform.UIKit.*
import platform.darwin.NSObject
import platform.posix.memcpy
import kotlin.coroutines.resume
import kotlin.random.Random

actual object ImagePicker {
    private var rootViewController: UIViewController? = null

    actual fun initialize(context: Any) {
        rootViewController = context as? UIViewController
    }

    actual suspend fun pickFromGallery(): PickedImage? =
        presentPicker(UIImagePickerControllerSourceType.UIImagePickerControllerSourceTypePhotoLibrary)

    actual suspend fun captureFromCamera(): PickedImage? =
        presentPicker(UIImagePickerControllerSourceType.UIImagePickerControllerSourceTypeCamera)

    @OptIn(ExperimentalForeignApi::class)
    private suspend fun presentPicker(sourceType: UIImagePickerControllerSourceType): PickedImage? {
        val vc = rootViewController ?: return null

        return suspendCancellableCoroutine { cont ->
            val picker = UIImagePickerController().apply {
                this.sourceType = sourceType
                this.allowsEditing = false
            }

            val delegate = ImagePickerDelegate { image ->
                picker.dismissViewControllerAnimated(true, null)
                if (image != null) {
                    val data = UIImageJPEGRepresentation(image, 0.85)
                    if (data != null) {
                        val bytes = data.toByteArray()
                        cont.resume(PickedImage(bytes, "photo_${Random.nextLong()}.jpg"))
                    } else {
                        cont.resume(null)
                    }
                } else {
                    cont.resume(null)
                }
            }

            picker.delegate = delegate

            cont.invokeOnCancellation {
                picker.dismissViewControllerAnimated(true, null)
            }

            vc.presentViewController(picker, animated = true, completion = null)
        }
    }
}

@OptIn(ExperimentalForeignApi::class)
private fun NSData.toByteArray(): ByteArray {
    val size = this.length.toInt()
    val result = ByteArray(size)
    if (size == 0) return result
    result.usePinned { pinned ->
        memcpy(pinned.addressOf(0), this.bytes, this.length)
    }
    return result
}

private class ImagePickerDelegate(
    private val onResult: (UIImage?) -> Unit
) : NSObject(), UIImagePickerControllerDelegateProtocol, UINavigationControllerDelegateProtocol {

    override fun imagePickerController(
        picker: UIImagePickerController,
        didFinishPickingMediaWithInfo: Map<Any?, *>
    ) {
        val image = didFinishPickingMediaWithInfo[UIImagePickerControllerOriginalImage] as? UIImage
        onResult(image)
    }

    override fun imagePickerControllerDidCancel(picker: UIImagePickerController) {
        onResult(null)
    }
}
