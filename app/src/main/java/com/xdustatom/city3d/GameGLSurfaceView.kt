package com.xdustatom.city3d

import android.content.Context
import android.opengl.GLSurfaceView
import android.view.MotionEvent
import kotlin.math.abs

class GameGLSurfaceView(context: Context) : GLSurfaceView(context) {

    var cityRenderer: CityRenderer? = null

    private var lastX = 0f
    private var lastY = 0f

    override fun onTouchEvent(event: MotionEvent): Boolean {
        val activeRenderer = cityRenderer ?: return true

        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                lastX = event.x
                lastY = event.y
            }

            MotionEvent.ACTION_MOVE -> {
                val dx = event.x - lastX
                val dy = event.y - lastY

                if (abs(dx) > 1f || abs(dy) > 1f) {
                    activeRenderer.cameraYaw += dx * 0.15f
                    activeRenderer.cameraPitch =
                        (activeRenderer.cameraPitch + dy * 0.1f).coerceIn(-20f, 20f)
                    lastX = event.x
                    lastY = event.y
                }
            }
        }
        return true
    }
}
