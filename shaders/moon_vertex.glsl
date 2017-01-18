uniform float moonMountFreq;
uniform float moonMountAmp;

varying vec3 vNormal;
varying vec3 pos;
varying float noise;

void main() {
	noise = moonMountAmp*pnoise(moonMountFreq*position, vec3(50.0));

	// Apply elevation in normal 
    pos = position + noise*normal;

    vNormal = normal;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
}