varying vec3 vNormal;
varying vec3 pos;

uniform float time;
uniform vec3 lightPos;
uniform vec3 cameraPos;
uniform float atmosphereOpacity;

void main() {
    vec3 lightColor = vec3(1.0);
    vec3 atmosphereColor = vec3(0,0.3,0.6);
    vec3 light = normalize(lightPos);
    vec3 V = normalize(cameraPosition-pos);
    vec3 L = normalize(lightPos-pos);
    vec3 R = -reflect(L, vNormal);

    float kd = 0.5;
    float ka = 0.8;
    float ks = 0.25;
    float shinyness = 1.0;
    float RdotV = clamp(dot(R,V),0.0, 1.0); //Clamp between 0-1 to prevent reflection on backside


    vec3 ambient  = ka * atmosphereColor;
    vec3 diffuse  = kd * atmosphereColor * max(0.0, dot(vNormal, light));
    vec3 specular = ks*(pow(RdotV, shinyness))*lightColor;

    vec3 finalColor = ambient+specular;

    float atmosphereNoise = pnoise(0.02*pos + 0.01*time, vec3(25.0));
    float atmosphereNoise2 = 0.5+0.5*pnoise(0.1*pos + vec3(0.4, 0.26, 0.66)*time, vec3(10.0));

    // Add high freq noise on edge
    atmosphereNoise -= 0.06*atmosphereNoise2;
    // Thresholding low freq noise, -1*humidity so that the slider is coorectw
    atmosphereNoise = smoothstep(-1.0, 0.1, atmosphereNoise);
    // add noise to atmosphereNoise
    atmosphereNoise -= 0.3*atmosphereNoise2;

    gl_FragColor = vec4(finalColor, atmosphereOpacity*atmosphereNoise);
  	
}









