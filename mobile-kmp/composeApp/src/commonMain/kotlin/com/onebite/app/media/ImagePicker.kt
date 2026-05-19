package com.onebite.app.media

data class PickedImage(val bytes: ByteArray, val fileName: String)

expect object ImagePicker {
    fun initialize(context: Any)
    suspend fun pickFromGallery(): PickedImage?
    suspend fun captureFromCamera(): PickedImage?
}
