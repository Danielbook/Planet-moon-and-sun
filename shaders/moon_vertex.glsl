uniform float moonMountFreq;
uniform float moonMountAmp;

varying vec3 vNormal;
varying vec3 pos;
varying vec2 noise;
varying vec2 noise2;

void main() {
	//noise = moonMountAmp*pnoise(moonMountFreq*position, vec3(50.0));

	noise = moonMountAmp*cellular(moonMountFreq*position);

	// Apply elevation in normal 
    pos = position + noise.x*normal;

    vNormal = normal;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
}