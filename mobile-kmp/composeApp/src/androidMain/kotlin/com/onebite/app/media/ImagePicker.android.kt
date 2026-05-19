package com.onebite.app.media

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.FileProvider
import kotlinx.coroutines.suspendCancellableCoroutine
import java.io.ByteArrayOutputStream
import java.io.File
import kotlin.coroutines.resume

actual object ImagePicker {
    private var activity: ComponentActivity? = null
    private var galleryLauncher: ActivityResultLauncher<String>? = null
    private var cameraLauncher: ActivityResultLauncher<Uri>? = null
    private var galleryContinuation: kotlinx.coroutines.CancellableContinuation<PickedImage?>? = null
    private var cameraContinuation: kotlinx.coroutines.CancellableContinuation<PickedImage?>? = null
    private var cameraImageUri: Uri? = null

    actual fun initialize(context: Any) {
        val act = context as ComponentActivity
        activity = act

        galleryLauncher = act.registerForActivityResult(
            ActivityResultContracts.GetContent()
        ) { uri: Uri? ->
            val result = uri?.let { readImageFromUri(it) }
            galleryContinuation?.resume(result)
            galleryContinuation = null
        }

        cameraLauncher = act.registerForActivityResult(
            ActivityResultContracts.TakePicture()
        ) { success: Boolean ->
            val result = if (success) cameraImageUri?.let { readImageFromUri(it) } else null
            cameraContinuation?.resume(result)
            cameraContinuation = null
        }
    }

    actual suspend fun pickFromGallery(): PickedImage? {
        return suspendCancellableCoroutine { cont ->
            galleryContinuation = cont
            galleryLauncher?.launch("image/*") ?: cont.resume(null)
        }
    }

    actual suspend fun captureFromCamera(): PickedImage? {
        val act = activity ?: return null
        val imageFile = File(act.cacheDir, "onebite_photo_${System.currentTimeMillis()}.jpg")
        cameraImageUri = FileProvider.getUriForFile(
            act, "${act.packageName}.fileprovider", imageFile
        )
        return suspendCancellableCoroutine { cont ->
            cameraContinuation = cont
            cameraLauncher?.launch(cameraImageUri!!) ?: cont.resume(null)
        }
    }

    private fun readImageFromUri(uri: Uri): PickedImage? {
        val act = activity ?: return null
        return try {
            val inputStream = act.contentResolver.openInputStream(uri) ?: return null
            val bitmap = BitmapFactory.decodeStream(inputStream)
            inputStream.close()

            // 최대 1024px로 리사이즈 (메모리 절약)
            val scaled = scaleBitmap(bitmap, 1024)
            val outputStream = ByteArrayOutputStream()
            scaled.compress(Bitmap.CompressFormat.JPEG, 85, outputStream)

            PickedImage(
                bytes = outputStream.toByteArray(),
                fileName = "photo_${System.currentTimeMillis()}.jpg"
            )
        } catch (e: Exception) {
            null
        }
    }

    private fun scaleBitmap(bitmap: Bitmap, maxSize: Int): Bitmap {
        val ratio = minOf(maxSize.toFloat() / bitmap.width, maxSize.toFloat() / bitmap.height)
        if (ratio >= 1f) return bitmap
        return Bitmap.createScaledBitmap(
            bitmap, (bitmap.width * ratio).toInt(), (bitmap.height * ratio).toInt(), true
        )
    }
}
