package com.auryx.editor.model

import android.net.Uri

data class VideoItem(
    val uri: Uri,
    val displayName: String,
    val localPath: String? = null
)
