uniform float mountFreq;
uniform float mountAmp;
uniform float time;

varying vec3 vNormal;
varying vec3 pos;
varying float noise;

void main() {
	noise = mountAmp*pnoise(mountFreq*position+vec3(0.2, 0.34, 0.52), vec3(20.0));

	// Apply elevation in normal 
    pos = position + noise*normal;

    vNormal = normal;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
}