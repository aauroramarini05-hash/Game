package com.xdustatom.city3d

import android.opengl.GLES20
import android.opengl.GLSurfaceView
import android.opengl.Matrix
import java.util.concurrent.TimeUnit
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10
import kotlin.math.cos
import kotlin.math.sin

class CityRenderer(
    private val onFpsUpdate: (Int) -> Unit
) : GLSurfaceView.Renderer {

    var targetFps: Int = 60
    var cameraYaw = 20f
    var cameraPitch = -10f

    private val projectionMatrix = FloatArray(16)
    private val viewMatrix = FloatArray(16)
    private val vpMatrix = FloatArray(16)

    private lateinit var cube: Cube
    private var startNs = System.nanoTime()
    private var lastFrameNs = startNs
    private var frameCounter = 0

    override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
        GLES20.glEnable(GLES20.GL_DEPTH_TEST)
        GLES20.glClearColor(0.02f, 0.03f, 0.07f, 1f)
        cube = Cube()
        startNs = System.nanoTime()
        lastFrameNs = startNs
    }

    override fun onSurfaceChanged(gl: GL10?, width: Int, height: Int) {
        GLES20.glViewport(0, 0, width, height)
        val ratio = width.toFloat() / height.toFloat()
        Matrix.frustumM(projectionMatrix, 0, -ratio, ratio, -1f, 1f, 2f, 200f)
    }

    override fun onDrawFrame(gl: GL10?) {
        val frameStart = System.nanoTime()
        val dt = (frameStart - startNs) / 1_000_000_000f

        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT or GLES20.GL_DEPTH_BUFFER_BIT)

        val radius = 26f
        val yawRad = Math.toRadians(cameraYaw.toDouble())
        val pitchRad = Math.toRadians(cameraPitch.toDouble())

        val camX = (sin(yawRad) * cos(pitchRad) * radius).toFloat()
        val camY = (sin(pitchRad) * radius + 8f).toFloat()
        val camZ = (cos(yawRad) * cos(pitchRad) * radius).toFloat()
        Matrix.setLookAtM(viewMatrix, 0, camX, camY, camZ, 0f, 0f, 0f, 0f, 1f, 0f)
        Matrix.multiplyMM(vpMatrix, 0, projectionMatrix, 0, viewMatrix, 0)

        drawGround(dt)
        drawCityBlocks(dt)

        frameCounter++
        val elapsedSinceCounter = frameStart - lastFrameNs
        if (elapsedSinceCounter >= TimeUnit.SECONDS.toNanos(1)) {
            val fps = (frameCounter * 1_000_000_000L / elapsedSinceCounter).toInt()
            onFpsUpdate(fps)
            frameCounter = 0
            lastFrameNs = frameStart
        }

        capFrameRate(frameStart)
    }

    private fun drawGround(time: Float) {
        cube.draw(
            vpMatrix = vpMatrix,
            x = 0f,
            y = -2.2f,
            z = 0f,
            sx = 50f,
            sy = 0.2f,
            sz = 50f,
            color = floatArrayOf(0.08f, 0.1f + 0.02f * sin(time).toFloat(), 0.14f, 1f)
        )
    }

    private fun drawCityBlocks(time: Float) {
        for (x in -8..8 step 2) {
            for (z in -8..8 step 2) {
                val height = 1.2f + ((x * x + z * z) % 10) * 0.45f
                val pulse = 0.2f * sin(time * 1.5f + x + z)
                val finalHeight = height + pulse

                val r = 0.2f + (x + 8) / 24f
                val g = 0.3f + (z + 8) / 24f
                val b = 0.55f + 0.25f * sin(time + x).toFloat().coerceIn(-1f, 1f)

                cube.draw(
                    vpMatrix = vpMatrix,
                    x = x.toFloat() * 1.5f,
                    y = finalHeight / 2f - 2f,
                    z = z.toFloat() * 1.5f,
                    sx = 1f,
                    sy = finalHeight,
                    sz = 1f,
                    color = floatArrayOf(r, g, b.coerceIn(0f, 1f), 1f)
                )
            }
        }
    }

    private fun capFrameRate(frameStartNs: Long) {
        val frameBudgetNs = (1_000_000_000L / targetFps.coerceIn(30, 75).toLong())
        val elapsedNs = System.nanoTime() - frameStartNs
        val sleepNs = frameBudgetNs - elapsedNs
        if (sleepNs > 0) {
            val millis = sleepNs / 1_000_000L
            val nanos = (sleepNs % 1_000_000L).toInt()
            Thread.sleep(millis, nanos)
        }
    }
}
