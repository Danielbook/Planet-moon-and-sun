varying vec3 vNormal;
varying vec3 pos;
varying float noise;

uniform float mountAmp;
uniform vec3 lightPos;
uniform vec3 cameraPos;

void main() {
  vec3 fireColor = vec3(0.98, 0.75, 0.4);
  vec3 surfaceColor = vec3(0.72, 0.05, 0);
  vec3 light = normalize(lightPos);

  float kd = 0.6;
  float ka = 0.4;

  // Sandy shores
  vec3 finalColor = mix(surfaceColor, fireColor, smoothstep(0.0, 5.0, noise));

  // Low freq noise
  finalColor = finalColor-0.4*pnoise(0.05*pos, vec3(100.0));

  vec3 ambient = ka * finalColor;
  vec3 diffuse = kd * finalColor * max(0.0, dot(vNormal, light));

  finalColor = ambient+diffuse;

  gl_FragColor = vec4(finalColor, 1.0);
}

