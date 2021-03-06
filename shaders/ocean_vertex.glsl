varying vec3 vNormal;
varying vec3 pos;

uniform float time;
uniform float avgTemp;

void main() {
	vNormal = normal;

	float oceanDisplacement = avgTemp-7.0;
	oceanDisplacement = max(0.0, oceanDisplacement);

	pos = position-normal*0.4*oceanDisplacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
}