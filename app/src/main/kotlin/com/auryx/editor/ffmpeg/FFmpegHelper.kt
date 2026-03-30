package com.auryx.editor.ffmpeg

import com.arthenica.ffmpegkit.FFmpegKit
import com.arthenica.ffmpegkit.ReturnCode

class FFmpegHelper {

    fun trim(input: String, output: String, startSec: Long, endSec: Long): Result<String> {
        val duration = (endSec - startSec).coerceAtLeast(1)
        val cmd = "-y -ss $startSec -i \"$input\" -t $duration -c copy \"$output\""
        return runCommand(cmd, output)
    }

    fun compress(input: String, output: String): Result<String> {
        val cmd = "-y -i \"$input\" -vcodec libx264 -crf 28 -preset veryfast -acodec aac -b:a 128k \"$output\""
        return runCommand(cmd, output)
    }

    fun merge(inputs: List<String>, output: String): Result<String> {
        val concatFile = output.replace(".mp4", "_concat.txt")
        val fileContent = inputs.joinToString("\n") { "file '${it.replace("'", "'\\''")}'" }
        java.io.File(concatFile).writeText(fileContent)
        val cmd = "-y -f concat -safe 0 -i \"$concatFile\" -c copy \"$output\""
        return runCommand(cmd, output).also {
            java.io.File(concatFile).delete()
        }
    }

    private fun runCommand(command: String, output: String): Result<String> {
        val session = FFmpegKit.execute(command)
        return if (ReturnCode.isSuccess(session.returnCode)) {
            Result.success(output)
        } else {
            Result.failure(IllegalStateException(session.failStackTrace ?: "FFmpeg execution failed"))
        }
    }
}
