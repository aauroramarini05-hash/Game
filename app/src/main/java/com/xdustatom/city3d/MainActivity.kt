package com.xdustatom.city3d

import android.content.Intent
import android.content.res.Configuration
import android.opengl.GLSurfaceView
import android.os.Bundle
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.SeekBar
import androidx.appcompat.app.AppCompatActivity
import com.xdustatom.city3d.databinding.ActivityMainBinding
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var glView: GameGLSurfaceView
    private lateinit var renderer: CityRenderer

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        renderer = CityRenderer { fps ->
            runOnUiThread {
                binding.fpsNow.text = getString(R.string.fps_value, fps)
            }
        }

        glView = GameGLSurfaceView(this).apply {
            cityRenderer = renderer
            setEGLContextClientVersion(2)
            setRenderer(renderer)
            renderMode = GLSurfaceView.RENDERMODE_CONTINUOUSLY
        }

        binding.glContainer.addView(glView)
        setupFpsLimit()
        setupLanguageSelector()
    }

    private fun setupFpsLimit() {
        binding.fpsSeek.progress = 30
        renderer.targetFps = binding.fpsSeek.progress + 30
        binding.fpsSeek.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                renderer.targetFps = progress + 30
            }

            override fun onStartTrackingTouch(seekBar: SeekBar?) = Unit
            override fun onStopTrackingTouch(seekBar: SeekBar?) = Unit
        })
    }

    private fun setupLanguageSelector() {
        val labels = listOf(getString(R.string.lang_en), getString(R.string.lang_it))
        val locales = listOf("en", "it")

        binding.languageSpinner.adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_dropdown_item,
            labels
        )

        val selectedLanguage = resources.configuration.locales[0].language
        val currentIndex = locales.indexOf(selectedLanguage).takeIf { it >= 0 } ?: 0
        binding.languageSpinner.setSelection(currentIndex)

        binding.languageSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(
                parent: AdapterView<*>?,
                view: View?,
                position: Int,
                id: Long
            ) {
                val selected = locales[position]
                if (selected != selectedLanguage) {
                    switchLanguage(selected)
                }
            }

            override fun onNothingSelected(parent: AdapterView<*>?) = Unit
        }
    }

    private fun switchLanguage(languageCode: String) {
        val locale = Locale(languageCode)
        Locale.setDefault(locale)

        val config = Configuration(resources.configuration)
        config.setLocale(locale)

        @Suppress("DEPRECATION")
        resources.updateConfiguration(config, resources.displayMetrics)

        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }

    override fun onResume() {
        super.onResume()
        glView.onResume()
    }

    override fun onPause() {
        glView.onPause()
        super.onPause()
    }
}
