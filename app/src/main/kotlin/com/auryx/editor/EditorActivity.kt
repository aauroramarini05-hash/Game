package com.auryx.editor

import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.isVisible
import androidx.recyclerview.widget.LinearLayoutManager
import com.auryx.editor.databinding.ActivityEditorBinding
import com.auryx.editor.ui.VideoAdapter
import com.auryx.editor.viewmodel.EditorViewModel
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.TextInputEditText
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer

class EditorActivity : AppCompatActivity() {

    private lateinit var binding: ActivityEditorBinding
    private val viewModel: EditorViewModel by viewModels()
    private lateinit var player: ExoPlayer

    private val pickMediaLauncher = registerForActivityResult(
        ActivityResultContracts.PickMultipleVisualMedia(10)
    ) { uris ->
        uris.forEach { viewModel.addVideo(it) }
        if (uris.isNotEmpty()) {
            preview(uris.first())
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityEditorBinding.inflate(layoutInflater)
        setContentView(binding.root)

        player = ExoPlayer.Builder(this).build()
        binding.previewPlayer.player = player

        val adapter = VideoAdapter { preview(it.uri) }
        binding.videoRecycler.layoutManager = LinearLayoutManager(this)
        binding.videoRecycler.adapter = adapter

        bindUi(adapter)
        bindActions()
    }

    private fun bindUi(adapter: VideoAdapter) {
        viewModel.videos.observe(this) { adapter.submitList(it) }
        viewModel.processing.observe(this) { busy ->
            binding.progressIndicator.isVisible = busy
        }
        viewModel.status.observe(this) {
            binding.statusLabel.text = it
            if (it.startsWith("Operation failed") || it.startsWith("Export failed")) {
                Toast.makeText(this, it, Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun bindActions() {
        binding.importButton.setOnClickListener {
            pickMediaLauncher.launch(
                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.VideoOnly)
            )
        }

        binding.trimButton.setOnClickListener { showTrimDialog() }
        binding.compressButton.setOnClickListener { viewModel.compress() }
        binding.mergeButton.setOnClickListener { viewModel.mergeAll() }
        binding.exportButton.setOnClickListener { viewModel.export() }
    }

    private fun showTrimDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_trim, null)
        val startInput = dialogView.findViewById<TextInputEditText>(R.id.startInput)
        val endInput = dialogView.findViewById<TextInputEditText>(R.id.endInput)

        MaterialAlertDialogBuilder(this)
            .setTitle("Trim Video")
            .setView(dialogView)
            .setPositiveButton("Trim") { _, _ ->
                val start = startInput.text.toString().toLongOrNull() ?: 0L
                val end = endInput.text.toString().toLongOrNull() ?: start + 5
                viewModel.trim(start, end)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun preview(uri: Uri) {
        player.setMediaItem(MediaItem.fromUri(uri))
        player.prepare()
        player.playWhenReady = false
    }

    override fun onStop() {
        super.onStop()
        player.pause()
    }

    override fun onDestroy() {
        super.onDestroy()
        player.release()
    }
}
