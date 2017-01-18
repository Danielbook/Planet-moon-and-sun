varying vec3 vNormal;
varying vec3 pos;

uniform float time;
uniform vec3 lightPos;
uniform vec3 cameraPos;
uniform vec3 oceanColor;
uniform float planetRadius;
uniform float avTemp;

void main() {
    // set up variables
    vec3 lightColor = vec3(1.0);
	vec3 light = normalize(lightPos);
    vec3 V = normalize(cameraPosition-pos);
    vec3 L = normalize(lightPos-pos);
    vec3 R = -reflect(L, vNormal); 
    float oceanOpacity = 0.7;

    float kd = 1.0;
  	float ka = 0.4;
    float ks = 1.0;
    float shinyness = 20.0;
    float RdotV = clamp(dot(R,V),0.0, 1.0); //Clamp between 0-1 to prevent reflection on backside

    float waveNoise = pnoise(0.1*pos + vec3(0.4, 0.26, 0.66)*time, vec3(10.0));
    vec3 finalColor=oceanColor+0.2*waveNoise;    
    vec3 specular = ks*(pow(RdotV, shinyness))*lightColor;
    finalColor = finalColor+specular;

    // Finaly add ambient+diffuse
    vec3 ambient  = ka * finalColor;
    vec3 diffuse  = kd * finalColor * max(0.0, dot(vNormal, light));
    finalColor = ambient+diffuse;

  	gl_FragColor = vec4(finalColor, 0.7);
}









