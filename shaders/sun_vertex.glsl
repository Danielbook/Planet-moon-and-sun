uniform float time;

varying vec3 vNormal;
varying vec3 pos;
varying float noise;
varying float noise2;

void main() {
	noise = 5.0*pnoise(0.005*time*position, vec3(4.0));

    noise2 = 10.0*pnoise(0.02*time*position, vec3(10.0));


	// Apply elevation in normal 
    pos = position + noise*normal*noise2;

    vNormal = normal;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
}