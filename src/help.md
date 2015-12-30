# Planet 3D

Generate textures for 3D planets in your browser.

## Controls

* Re-render the planet by hitting **shift + enter** after you edit the settings.
* **Left click and drag** on the planet to rotate it and send it spinning.
* Use the **mouse wheel** to zoom in and out.
* Hold **shift** and use the **mouse wheel** to adjust the resolution of the
  rendered planet. This can be handy if the rendering is slow.

## Menu

* **Help** is this help!
* **Presets** will allow you to load some already written texture and preview
  settings so that you can get an idea of what is possible with Planet 3D. Feel
  free to play with these - if you break something, you can just load it up again.
* **Save** will generate a zip file of your textures and settings, and kick off
  a download for you.

## Settings

On the right, you'll see a bunch of text. This is [hjson](http://hjson.org/)
that instructs Planet 3D how to generate textures and render the preview.

There's two sections, `preview` and `texture`. The `preview` section describes
how to render the planet that you see on your screen. The `texture` section
describes how to generate the textures that compose the rendered planet. We'll
cover those two sections below:

### Preview Settings

* **`light`** is the light hitting the planet.
  * **`position`** is the direction the light is coming from in x, y, z coordinates.
    The directions x, y, z, correspond to right, up, and out of the screen, respectively.
    For example, setting this to `[1, 1, 1]` will make the light appear to be coming from
    the right, above, and in front of the planet.
  * **`color`** is the color of the light in red, green, and blue coordinates. For
    example, `[0.25, 0.5, 1.0]` will represent a color that is a mix of 0.25 red, 0.5 green,
    and 1.0 blue.
  * **`ambient`** is the [red, green, blue] color of the ambient light reflected from the planet
    surface.
  * **`specularFalloff`** is the "shininess" of the specular-reflecting regions of the planet surface.
    Increasing this value decreases the size and increases the intensity of the shiny specular "spot".
* **`atmosphere`** describes how the planet atmosphere is rendered. See the `terra` and `gaseous` presets
  for a couple of examples.
  * **`wrap`** describes how far into the planet's shadow the atmosphere extends. 0.0 will make it extend
    to the planet's shadow and no further. A value of 1.0 will extend it just barely to the far
    side of the planet, fading all along the way into the shadow. A value of 2.0 will cover the complete
    radius of the planet in atmosphere.
  * **`color`** is the [red, green, blue] color of the atmosphere.
  * **`width`** is how far from the planet surface the atmosphere extends.
* **`glow`** is how to handle making emissive regions of the planet glow.
  * **`iterations`** is how many iterations of the blur algorithm to run. The greater this
    number, the more the glow will spread. This should be an integer, e.g. `8`.
  * **`strength`** represents how much to magnify the intensity of the glow during each
    blur algorithm iteration. 1.0 will be no magnification, < 1.0 will reduce the intensity,
    and > 1.0 will increase it. This parameter is very sensitive. You'll probably want to keep
    it between 1.0 and 1.1.

### Texture Settings

* **`seed`** is a string that you can change to alter the noise on the surface of your planet.
* **`resolution`** is the resolution that the textures will be rendered at. These need to be
  integer values that are a power of two, e.g., `128`, `256`, `512`, `1024`,
  etc. If you do not provide such a number, the power of two integer less than what you
  provided will be silently used instead.
  **CAUTION: setting this too high for your system can crash all the things. Be careful.**
* **`heightGradient`** describes the colors of your planet surface based on height. The value
  `val` is a 3-component list of floats representing a red/green/blue color, e.g.,
  `[1.0, 0.5, 0.25]`. The value `stop` defines where on the height gradient this color is
  defined. See any of the presets for an example of this.
* **`normalGradient`** is the magnitude of the normal map at different heights. For example,
  an earth-like planet might have a normal gradient of zero up to the sea level, and then
  an increased gradient afterwards. See the terra preset for an example of this.
* **`specularGradient`** is the amount of light reflected specularly at various heights. To continue
  the earth-like planet example, you would want the water to have a high specularity, and the land
  to have a low specularity. See the terra preset for an example of this.
* **`emissionGradient`** is a color gradient that represents the emissive color of the planet surface.
  This is the gradient that you would use for glowing regions, such as lava or glowing magic blue
  pools. If we wanted to treat everything below 0.25 as a pool of lava, for example, we'd set that
  to a yellow-reddish hue, and black everywhere above it. See the lavarock preset for an example
  of this.
* **`scale`** is the noise scale in x, y, and z directions. Increasing the scale increases the frequency
  of the noise, which decreases the feature size. Since the scale can be set independently on each of
  the three axes, you can achieve some interesting effects, such as the gas giant spinning atmosphere
  effect in the `gaseous` preset.
* **`falloff`** is the steepness of the terrain. Increasing this will expand the size of the low-laying
  regions of your planet.
* **`detail`** is the number of iterations of noise used when generating the planet texture. Increasing
  it increases the apparent level of detail of your planet. High levels of detail may require
  higher texture resolutions to look correct.
* **`clouds`** is the cloud layer texture. See the `terra` preset for a complete example.
  * **`color`** is the [red, green, blue] color of the clouds.
  * **`scale`** is the same as the `scale` parameter described above, but for the cloud layer.
  * **`falloff`** is the rate at which the clouds move towards transparency.
  * **`opacity`** is the overall opacity of the clouds.
  * **`detail`** is the same as the `detail` parameter described above, but for the cloud layer.
