varying vec3 vNormal;
varying vec3 pos;
varying float noise;

uniform float mountAmp;
uniform vec3 surfaceColor;
uniform vec3 lightPos;
uniform vec3 cameraPos;
uniform vec3 shoreColor;
uniform float avgTemp;

void main() {
  vec3 snowColor = vec3(0.8, 0.9, 1.0);
  vec3 sandColor = shoreColor;
  vec3 light = normalize(lightPos);

  float kd = 0.6;
  float ka = 0.4;

  float shoreLineTop = mountAmp/8.0+avgTemp-7.0;

  shoreLineTop = max(shoreLineTop, 3.0);

  // Sandy shores
  vec3 finalColor=mix(sandColor, surfaceColor, smoothstep(0.0, shoreLineTop, noise));

  // Snow on peaks
  finalColor=mix(finalColor, snowColor, smoothstep(avgTemp, avgTemp+7.0, noise));

  // Low freq noise
  finalColor=finalColor-0.04*pnoise(1.0*pos, vec3(10.0));

  vec3 ambient = ka * finalColor;
  vec3 diffuse = kd * finalColor * max(0.0, dot(vNormal, light));

  finalColor = ambient+diffuse;

  gl_FragColor = vec4(finalColor, 1.0);
}

