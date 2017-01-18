varying vec3 vNormal;
varying vec3 pos;
varying float noise;
varying vec3 vWorldPosition;

uniform float moonMountAmp;
uniform vec3 surfaceColor;
uniform vec3 lightPos;
uniform vec3 cameraPos;

void main() {
  vec3 darkColor = vec3(0.45, 0.45, 0.45);
  vec3 light = normalize(lightPos);

  float kd = 0.6;
  float ka = 0.4;

  float shoreLineTop = moonMountAmp;

  shoreLineTop = max(shoreLineTop, 1.0);

  vec3 finalColor = mix(darkColor, surfaceColor, smoothstep(-2.0, shoreLineTop, noise));

  // Low freq noise
  finalColor = finalColor - 0.09 * pnoise(1.0 * pos, vec3(10.0));

  vec3 ambient = ka * finalColor;
  vec3 diffuse = kd * finalColor * max(0.0, dot(vNormal, light));

  finalColor = ambient+diffuse;

  gl_FragColor = vec4(finalColor, 1.0);

}

