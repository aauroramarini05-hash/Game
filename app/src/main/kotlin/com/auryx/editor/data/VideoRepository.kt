package com.auryx.editor.data

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import com.auryx.editor.model.VideoItem
import java.io.File

class VideoRepository(private val context: Context) {

    fun cacheLocalFile(source: Uri): String {
        val resolver = context.contentResolver
        val name = queryDisplayName(source)
        val target = File(context.cacheDir, "source_${System.currentTimeMillis()}_${name}")
        resolver.openInputStream(source).use { input ->
            target.outputStream().use { output ->
                input?.copyTo(output) ?: error("Unable to open source stream")
            }
        }
        return target.absolutePath
    }

    fun buildOutputFile(prefix: String): File {
        val dir = File(context.cacheDir, "processed").apply { mkdirs() }
        return File(dir, "${prefix}_${System.currentTimeMillis()}.mp4")
    }

    fun saveToGallery(outputFile: File): Uri {
        val values = ContentValues().apply {
            put(MediaStore.Video.Media.DISPLAY_NAME, outputFile.name)
            put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_MOVIES + "/AuryxEditor")
                put(MediaStore.Video.Media.IS_PENDING, 1)
            }
        }

        val resolver = context.contentResolver
        val collection = MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
        val uri = resolver.insert(collection, values) ?: error("Failed to create MediaStore item")

        resolver.openOutputStream(uri).use { output ->
            outputFile.inputStream().use { input ->
                input.copyTo(output ?: error("Unable to open output stream"))
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            values.clear()
            values.put(MediaStore.Video.Media.IS_PENDING, 0)
            resolver.update(uri, values, null, null)
        }

        return uri
    }

    fun toVideoItem(uri: Uri): VideoItem {
        return VideoItem(uri = uri, displayName = queryDisplayName(uri))
    }

    private fun queryDisplayName(uri: Uri): String {
        val cursor = context.contentResolver.query(uri, arrayOf(MediaStore.MediaColumns.DISPLAY_NAME), null, null, null)
        cursor?.use {
            if (it.moveToFirst()) {
                return it.getString(0) ?: "video.mp4"
            }
        }
        return "video.mp4"
    }
}
