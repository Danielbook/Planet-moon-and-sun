
varying vec3 vNormal;
varying vec3 pos;

uniform float time;
uniform float atmosphereHeight;

void main() {

	vNormal = normal;

	pos = position+normal*atmosphereHeight;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );

}