uniform float time;

varying vec3 vNormal;
varying vec3 pos;
varying float noise;

void main() {
	noise = 150.0 * pnoise(0.0001 * (time) * vec3(0.9, 0.26, 0.56) * position, vec3(200.0));

	// Apply elevation in normal 
    pos = position + noise * normal;

    vNormal = normal;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
}