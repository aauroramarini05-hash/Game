package com.auryx.editor.viewmodel

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.auryx.editor.data.VideoRepository
import com.auryx.editor.ffmpeg.FFmpegHelper
import com.auryx.editor.model.VideoItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

class EditorViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = VideoRepository(application.applicationContext)
    private val ffmpegHelper = FFmpegHelper()

    private val _videos = MutableLiveData<List<VideoItem>>(emptyList())
    val videos: LiveData<List<VideoItem>> = _videos

    private val _processing = MutableLiveData(false)
    val processing: LiveData<Boolean> = _processing

    private val _status = MutableLiveData<String>()
    val status: LiveData<String> = _status

    private var currentOutput: File? = null

    fun addVideo(uri: Uri) {
        val existing = _videos.value.orEmpty().toMutableList()
        existing.add(repository.toVideoItem(uri))
        _videos.value = existing
    }

    fun trim(start: Long, end: Long) {
        val selected = _videos.value?.firstOrNull() ?: return
        runAction("Trimming video...") {
            val input = repository.cacheLocalFile(selected.uri)
            val out = repository.buildOutputFile("trim")
            ffmpegHelper.trim(input, out.absolutePath, start, end).getOrThrow()
            out
        }
    }

    fun compress() {
        val selected = _videos.value?.firstOrNull() ?: return
        runAction("Compressing video...") {
            val input = repository.cacheLocalFile(selected.uri)
            val out = repository.buildOutputFile("compressed")
            ffmpegHelper.compress(input, out.absolutePath).getOrThrow()
            out
        }
    }

    fun mergeAll() {
        val selected = _videos.value.orEmpty()
        if (selected.size < 2) {
            _status.value = "Select at least 2 videos to merge"
            return
        }
        runAction("Merging videos...") {
            val inputs = selected.map { repository.cacheLocalFile(it.uri) }
            val out = repository.buildOutputFile("merged")
            ffmpegHelper.merge(inputs, out.absolutePath).getOrThrow()
            out
        }
    }

    fun export() {
        val output = currentOutput
        if (output == null || !output.exists()) {
            _status.value = "No processed video available"
            return
        }

        viewModelScope.launch {
            _processing.value = true
            _status.value = "Exporting to gallery..."
            runCatching {
                withContext(Dispatchers.IO) { repository.saveToGallery(output) }
            }.onSuccess {
                _status.value = "Video exported successfully"
            }.onFailure {
                _status.value = "Export failed: ${it.message}"
            }
            _processing.value = false
        }
    }

    private fun runAction(statusMessage: String, action: suspend () -> File) {
        viewModelScope.launch {
            _processing.value = true
            _status.value = statusMessage
            runCatching {
                withContext(Dispatchers.IO) { action() }
            }.onSuccess {
                currentOutput = it
                _status.value = "Done: ${it.name}. Tap Export to save."
            }.onFailure {
                _status.value = "Operation failed: ${it.message}"
            }
            _processing.value = false
        }
    }
}
