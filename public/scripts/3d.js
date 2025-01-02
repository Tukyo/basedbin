document.addEventListener('DOMContentLoaded', async () => {
    console.log('3d.js loaded...');
    setTimeout(() => {
        initThree();
        listenForKonamiCode();
    }, 1000); // 1 second delay
});

const enableCameraEffects = true;

const transparent = null;

const tokenImages = [
    '../assets/img/tokens/01.webp',
    '../assets/img/tokens/02.webp',
    '../assets/img/tokens/03.webp',
    '../assets/img/tokens/04.webp',
    '../assets/img/tokens/05.webp',
    '../assets/img/tokens/06.webp',
    '../assets/img/tokens/07.webp',
    '../assets/img/tokens/08.webp',
    '../assets/img/tokens/09.webp',
    '../assets/img/tokens/10.webp',
    '../assets/img/tokens/11.webp',
    '../assets/img/tokens/13.webp',
    '../assets/img/tokens/14.webp',
    '../assets/img/tokens/15.webp',
    '../assets/img/tokens/16.webp',
    '../assets/img/tokens/17.webp',
    '../assets/img/tokens/18.webp',
    '../assets/img/tokens/19.webp',
    '../assets/img/tokens/20.webp',
    '../assets/img/tokens/21.webp',
    '../assets/img/tokens/22.webp',
    '../assets/img/tokens/23.webp',
    '../assets/img/tokens/24.webp'
]
function getRandomTokenImage() { return tokenImages[Math.floor(Math.random() * tokenImages.length)]; }

let mainCamera = null;
let mainComposer = null;
let mainScene = null;
let mixer = [];

const coinBatches = [];

const konamiCode = [
    'ArrowUp', 'ArrowUp', 'ArrowDown',
    'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA', 'Enter'
];

const projectileMesh = '../assets/projectile.glb';
const coinMesh = '../assets/coin_animation.glb';
const coinVFX = '../assets/coin_destroy.glb';
//////////////////////////////////////////////////////////////////////
/*******************************************************************/
//////////////////////////////////////////////////////////////////////

/********************************************************************
 * Constants
 * - {al_color} Ambient Light Color
 * - {al_intensity} Ambient Light Intensity
 * - {dl_color} Directional Light Color
 * - {dl_intensity} Directional Light Intensity
 * - {frameRate} Frame Rate for Animation
 * - {anim_speed} Animation Speed
 * - {brightnessMultiplier} Brightness Multiplier for token images
 * - {emissionStrength} Emissive Strength for Sides
 * - {minTokenAmount} -> {maxTokenAmount} Token Amount Range
 * - {spawnIntervalTime} Spawn Interval Time
 * - {minX} -> {maxX} | {minY} -> {maxY} | {minZ} -> {maxZ} Spawn Ranges
 * - {floorY} Bottom of the scene, particles die here
 * - {gravity} Gravity for particles
 * - {minGravMult} -> {maxGravMult} Gravity Multiplier Range
 *******************************************************************/
const al_color = 0xffffff;
const al_intensity = 5;

const dl_color = 0xffffff;
const dl_intensity = 0.5;

const frameRate = 60;
const anim_speed = 0.250;

const brightnessMultiplier = .55;
const emissionStrength = 2.5;

const minTokenAmount = 5;
const maxTokenAmount = 50;
const spawnIntervalTime = 5000;

const minX = -25, maxX = 25;
const minY = 20, maxY = 40;
const minZ = -20, maxZ = 10;

const minScale = 0.05;
const maxScale = 2.5;

const floorY = -20;

const gravity = 0.15;
const minGravMult = 0.35;
const maxGravMult = 0.75;
const gravityMultipliers = [];

/********************************************************************
 * 1) Default Camera Options
 * - {bloomThreshold} What is considered bright enough to bloom
 * - {bloomStrength} - {bloomRadius} Bloom strength and radius
 * - {bloomResolution} Resolution for the bloom effect (performance)
 * - {vignetteStrength} - {vignetteOffset} Vignette strength and offset
 * - {focus} - {aperture} - {maxBlur} - {depthRange} - {dofResolution}
 * - >  Depth of Field options
 * - >  Focus point (center of scene)
 ********************************************************************/
const cameraOptions = {
    bloomThreshold: 0.01,
    bloomStrength: 1.15,
    bloomRadius: 1.5,
    bloomResolution: 64,
    vignetteStrength: 3.5,
    vignetteOffset: 1.3,
    focus: 0,
    aperture: 25.0,
    maxBlur: 10.0,
    depthRange: 4.5,
    dofResolution: 64
};
/********************************************************************
 * 2) Initialization: Attach Depth Texture and use it in Composer
 ********************************************************************/
function initThree() {
    const canvas = document.getElementById("three_js_canvas");
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const { composer } = initCamera(scene, renderer);

    scene.background = transparent;
    mainScene = scene;
    mainComposer = composer;

    // Lights
    const ambientLight = new THREE.AmbientLight(al_color, al_intensity);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(dl_color, dl_intensity);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    const loader = new THREE.GLTFLoader();
    loader.load(
        coinMesh,
        (gltf) => {
            function spawnCoins() {
                if (!pageFocused) { console.log("Animation paused..."); return; }
                const tokenAmount = Math.floor(Math.random() * (maxTokenAmount - minTokenAmount + 1)) + minTokenAmount;
                const batchTimestamp = Date.now();
                const currentBatch = { coins: [], timestamp: batchTimestamp };

                for (let i = 0; i < tokenAmount; i++) {
                    const model = gltf.scene.getObjectByName('obj_coin').clone();
                    if (model) {
                        const randomX = Math.random() * (maxX - minX) + minX;
                        const randomY = Math.random() * (maxY - minY) + minY;
                        const randomZ = Math.random() * (maxZ - minZ) + minZ;
                        model.position.set(randomX, randomY, randomZ);

                        const randomScale = Math.random() * (maxScale - minScale) + minScale;
                        model.scale.set(randomScale, randomScale, randomScale);

                        scene.add(model);
                        currentBatch.coins.push(model);

                        const randomImagePath = tokenImages[Math.floor(Math.random() * tokenImages.length)];
                        applyTextureToModel(model, randomImagePath);

                        const tokenMixer = new THREE.AnimationMixer(model);

                        let randomStartFrame = Math.floor(Math.random() * 300) + 1;
                        let randomEndFrame = Math.floor(Math.random() * 201) + 900;

                        if (randomStartFrame > randomEndFrame) {
                            const temp = randomStartFrame;
                            randomStartFrame = randomEndFrame;
                            randomEndFrame = temp;
                        }

                        const isReverse = Math.random() < 0.5;
                        const directionMultiplier = isReverse ? 1 : 1;

                        gltf.animations.forEach((clip) => {
                            const action = tokenMixer.clipAction(clip);
                            action.loop = THREE.LoopOnce;
                            action.clampWhenFinished = true;
                            action.userData = {
                                startTime: randomStartFrame / frameRate,
                                endTime: randomEndFrame / frameRate,
                                speed: directionMultiplier * anim_speed
                            };
                            action.time = isReverse
                                ? (randomEndFrame / frameRate)
                                : (randomStartFrame / frameRate);

                            action.play();
                        });

                        mixer.push(tokenMixer);

                        const randomGravityMultiplier = Math.random() * (maxGravMult - minGravMult) + minGravMult;
                        gravityMultipliers.push(randomGravityMultiplier);
                        model.userData.gravityMultiplier = randomGravityMultiplier;
                        model.userData.ySpeed = gravity * randomGravityMultiplier;
                    } else {
                        console.error('obj_coin not found in the loaded GLB file.');
                    }
                }
                coinBatches.push(currentBatch);
            }
            spawnCoins();
            setInterval(spawnCoins, spawnIntervalTime);
        },
        undefined,
        (error) => {
            console.error('An error occurred while loading the GLB file:', error);
        }
    );
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();

        if (mixer && Array.isArray(mixer)) {
            mixer.forEach((tokenMixer) => {
                tokenMixer._actions.forEach((action) => {
                    const startTime = action.userData.startTime;
                    const endTime = action.userData.endTime;
                    const localSpeed = action.userData.speed;

                    action.time += delta * localSpeed;

                    if (localSpeed > 0) { // Playing forward
                        // If passed the end, reset to start
                        if (action.time > endTime) { action.time = startTime; }
                    }
                    else { // Playing in reverse
                        // If went before the start, jump to end
                        if (action.time < startTime) { action.time = endTime; }
                    }
                });
                tokenMixer.update(0);
            });
        }
        coinBatches.forEach((batch) => {
            batch.coins = batch.coins.filter((coin) => {
                const gravityEffect = gravity * coin.userData.gravityMultiplier;
                coin.userData.ySpeed = gravityEffect;
                coin.position.y -= gravityEffect;

                if (coin.position.y <= floorY) {
                    scene.remove(coin);
                    return false;
                }
                return true;
            });
        });
        composer.render();
    }
    animate();
}
/********************************************************************
 * 3) initCamera: Create DepthTexture-enabled RenderTarget + DOF Pass
 ********************************************************************/
function initCamera(scene, renderer, options = {}) {
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = options.cameraZ || 5;

    // Merge user options with defaults
    options = { ...cameraOptions, ...options };

    /**************************************
     * Create an EffectComposer that has
     * a depthTexture attached to its
     * main render target.
     **************************************/
    const renderTarget = new THREE.WebGLRenderTarget(
        window.innerWidth,
        window.innerHeight,
        {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            depthBuffer: true
        }
    );
    renderTarget.depthTexture = new THREE.DepthTexture();
    renderTarget.depthTexture.type = THREE.UnsignedShortType;

    const composer = new THREE.EffectComposer(renderer, renderTarget);
    composer.setSize(window.innerWidth, window.innerHeight);

    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    if (enableCameraEffects) {
        // Bloom
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            options.bloomStrength,
            options.bloomRadius,
            options.bloomThreshold,
            options.bloomResolution
        );
        composer.addPass(bloomPass);

        // FXAA
        const fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
        fxaaPass.uniforms['resolution'].value.x = 1 / window.innerWidth;
        fxaaPass.uniforms['resolution'].value.y = 1 / window.innerHeight;
        composer.addPass(fxaaPass);

        // Vignette
        const vignettePass = new THREE.ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                offset: { value: options.vignetteOffset },
                darkness: { value: options.vignetteStrength }
            },
            vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
            fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform float offset;
            uniform float darkness;
            varying vec2 vUv;

            void main() {
                vec4 color = texture2D(tDiffuse, vUv);
                float dist = distance(vUv, vec2(0.5, 0.5));
                float vignette = smoothstep(0.8 + offset, 0.8 - offset, dist * darkness);
                color.rgb *= vignette;
                gl_FragColor = color;
            }
        `,
        });
        composer.addPass(vignettePass);

        /**********************************************************
         * Depth of Field Pass with Real Depth Sampling
         **********************************************************/
        const depthOfFieldPass = new THREE.ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                tDepth: { value: null }, // We'll feed in composer.renderTarget.depthTexture
                cameraNear: { value: camera.near },
                cameraFar: { value: camera.far },
                focus: { value: options.focus },
                aperture: { value: options.aperture },
                maxBlur: { value: options.maxBlur },
                depthRange: { value: options.depthRange },
                dofResolution: { value: options.dofResolution }
            },
            vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
            fragmentShader: `
            // Converts [0..1] depth to view Z distance
            float perspectiveDepthToViewZ(const in float invClipZ, const in float near, const in float far) {
                return (near * far) / ((far - near) * invClipZ - far);
            }

            // Read the raw depth from tDepth
            float readDepth(sampler2D depthSampler, vec2 coord) {
                // Depth is packed in the .r channel, ranging [0..1]
                return texture2D(depthSampler, coord).r;
            }

            uniform sampler2D tDiffuse;
            uniform sampler2D tDepth;
            uniform float cameraNear;
            uniform float cameraFar;
            uniform float focus;
            uniform float aperture;
            uniform float maxBlur;
            uniform float depthRange;
            uniform float dofResolution;
            varying vec2 vUv;

            void main() {
                // Read color
                vec4 sceneColor = texture2D(tDiffuse, vUv);

                // Get depth as [0..1]
                float rawDepth = readDepth(tDepth, vUv);

                // Convert that to view space Z
                float viewZ = perspectiveDepthToViewZ(rawDepth, cameraNear, cameraFar);

                // We want something near 'focus' in view space to be crisp, everything else blurred
                // The camera is at +Z in view space, so we check the difference from 'focus'
                float distFromFocus = abs(viewZ - focus);

                // Map distance to a blur factor [0..1] using depthRange
                float blurFactor = clamp(distFromFocus / depthRange, 0.0, 1.0);

                // Multiply by aperture => bigger aperture => more blur
                blurFactor *= aperture;

                // limit blurFactor with maxBlur
                blurFactor = min(blurFactor, 1.0);

                // Now we do a naive 5x5 box blur using blurFactor
                // The radius in pixel coords
                float radius = maxBlur * blurFactor * dofResolution;
                vec2 texSize = vec2(textureSize(tDiffuse, 0)) * dofResolution;
                vec2 texelSize = vec2(1.0) / texSize;
                // Sum color
                vec4 sum = vec4(0.0);
                float total = 0.0;
                // Larger kernel for a stronger blur
                for(int x = -2; x <= 2; x++){
                    for(int y = -2; y <= 2; y++){
                        vec2 offset = vec2(float(x), float(y)) * texelSize * radius;
                        sum += texture2D(tDiffuse, vUv + offset);
                        total += 1.0;
                    }
                }
                vec4 blurredColor = sum / total;

                // Mix original with blurred color
                gl_FragColor = mix(sceneColor, blurredColor, blurFactor);
            }
        `
        });
        // Bind the depth texture from our main render target
        depthOfFieldPass.uniforms.tDepth.value = renderTarget.depthTexture;
        composer.addPass(depthOfFieldPass);
    }
    mainCamera = camera;
    return { camera, composer };
}
/********************************************************************
 * 4) applyTextureToModel: Load texture and apply to model
 *  - ShaderMaterial for brightness control
 * - Side material color from CSS variable
 * - Emissive color for sides
 * - Emissive intensity for sides
 * - ShaderMaterial for brightness control
 ********************************************************************/
function applyTextureToModel(model, imagePath = null) {
    const textureLoader = new THREE.TextureLoader();
    if (imagePath) {
        textureLoader.load(
            imagePath,
            (texture) => {
                model.traverse((child) => {
                    if (child.isMesh && child.material && child.material.name === "mat_face") {
                        child.material = new THREE.ShaderMaterial({
                            uniforms: {
                                map: { value: texture },
                                brightness: { value: brightnessMultiplier }
                            },
                            vertexShader: `
                                varying vec2 vUv;
                                void main() {
                                    vUv = uv;
                                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                                }
                            `,
                            fragmentShader: `
                                uniform sampler2D map;
                                uniform float brightness;
                                varying vec2 vUv;
                                void main() {
                                    vec4 texColor = texture2D(map, vUv);
                                    gl_FragColor = vec4(texColor.rgb * brightness, texColor.a);
                                }
                            `
                        });
                    }
                });
            },
            undefined,
            (error) => {
                console.error(`Failed to load texture from: ${imagePath}`, error);
            }
        );
    }
    model.traverse((child) => {
        const mainColor = getComputedStyle(document.documentElement).getPropertyValue('--main').trim();
        if (child.isMesh && child.material) {
            if (child.material.name === "mat_sides" || child.material.name === "mat_projectile") {
                if (mainColor) {
                    child.material.color.set(mainColor);
                    child.material.emissiveIntensity = emissionStrength;
                    child.material.emissive.set(mainColor);
                    child.material.needsUpdate = true;
                }
            }
        }
    });
}
//////////////////////////////////////////////////////////////////////
/*******************************************************************/
//////////////////////////////////////////////////////////////////////
















let gameActive = false;
let score = 0;
const game_container = document.getElementById('game_container');
const game_score_value = document.getElementById('game_score_value');
async function shoot(event) {
    const loader = new THREE.GLTFLoader();
    const projectileModel = await new Promise((resolve, reject) => { loader.load(projectileMesh, resolve, undefined, reject); });

    const projectile = projectileModel.scene.clone();

    // Apply the color using --main
    applyTextureToModel(projectile, null);

    // Set initial position to the bottom middle of the camera's view
    const cameraBottomMiddle = new THREE.Vector3(0, -25, -10);
    cameraBottomMiddle.unproject(mainCamera);
    projectile.position.copy(cameraBottomMiddle);
    mainScene.add(projectile);

    // Calculate the target position in 3D space
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, mainCamera);

    // Create a plane at the desired depth (e.g., z = 0)
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, -1), -20);
    const targetPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(planeZ, targetPoint);

    const duration = 0.5; // Basically speed
    const startTime = performance.now();
    let collisionDetected = false;

    function animateProjectile() {
        const elapsed = (performance.now() - startTime) / 1000;
        const t = Math.min(elapsed / duration, 1);
        projectile.position.lerpVectors(cameraBottomMiddle, targetPoint, t);

        const projectileBoundingBox = new THREE.Box3().setFromObject(projectile);
        coinBatches.forEach((batch, batchIndex) => {
            batch.coins.forEach((coin, coinIndex) => {
                if (collisionDetected) return;
                const coinBoundingBox = new THREE.Box3().setFromObject(coin);
                if (projectileBoundingBox.intersectsBox(coinBoundingBox)) {
                    console.log(`Collision detected: Projectile and Coin ${coinIndex} in Batch ${batchIndex}`);
                    mainScene.remove(coin);
                    mainScene.remove(projectile);
                    batch.coins.splice(coinIndex, 1);
                    spawnVFX(coin.position);
                    const coinDetails = getCoinDetails(coin);
                    updateScore(coinDetails);
                    collisionDetected = true;
                }
            });
        });
        
        if (!collisionDetected && t < 1) {
            requestAnimationFrame(animateProjectile);
        } else if (!collisionDetected) { // Miss
            mainScene.remove(projectile);
            updateScore(null);
        }
    }
    animateProjectile();
}
function listenForKonamiCode() {
    let currentPosition = 0;
    let timer;
    const CODE_TIMEOUT = 2000;

    document.addEventListener('keydown', (e) => {
        if (konamiCode[currentPosition] === e.code) {
            console.log("Correct key: " + e.code);
            currentPosition++;

            clearTimeout(timer);
            if (currentPosition === konamiCode.length) {
                console.log("Code entered!");
                document.addEventListener('click', shoot);
                if (!gameActive) { toggleGame(true); } else { toggleGame(false); }
                currentPosition = 0;
            } else {
                timer = setTimeout(() => {
                    console.log("Timeout, try again.");
                    currentPosition = 0;
                }, CODE_TIMEOUT);
            }
        } else {
            console.log("Incorrect key, try again.");
            currentPosition = 0;
        }
    });
}
async function spawnVFX(vector3) {
    console.log("spawnVFX() called. Vector3: " + vector3);

    const loader = new THREE.GLTFLoader();
    const vfxModel = await new Promise((resolve, reject) => {
        console.log("Loading coinVFX...");
        loader.load(
            coinVFX,
            (gltf) => {
                console.log("coinVFX loaded successfully.");
                resolve(gltf);
            },
            undefined,
            (error) => {
                console.error("Error loading coinVFX: ", error);
                reject(error);
            }
        );
    });

    const vfx = vfxModel.scene.clone();
    applyTextureToModel(vfx, null);

    const pivot = new THREE.Object3D();
    pivot.position.copy(vector3);
    pivot.add(vfx);
    vfx.position.set(0, 0, 0);

    const randomRot = Math.random() * 2 * Math.PI;
    pivot.rotation.set(0, randomRot, 0);

    mainScene.add(pivot);

    console.log("Creating AnimationMixer for VFX.");
    const vfxMixer = new THREE.AnimationMixer(vfx);

    vfxModel.animations.forEach((clip) => {
        const action = vfxMixer.clipAction(clip);
        action.loop = THREE.LoopOnce;
        action.clampWhenFinished = true;
        action.userData = {
            startTime: 0,
            endTime: clip.duration,
            speed: 1
        };
        action.play();
    });

    // Remove the VFX after 200 frames (assuming 60 FPS, this is approximately 3.33 seconds)
    const frameRate = 60;
    const duration = 180 / frameRate * 1000; // Convert to milliseconds
    setTimeout(() => {
        mainScene.remove(pivot);
        console.log("VFX removed after 200 frames.");
    }, duration);

    mixer.push(vfxMixer);
}
function toggleGame(bool) {
    if (bool) {
        toggleGameUI(true);
        startLoop(track);
        gameActive = true;
    } else {
        toggleGameUI(false);
        stopLoop();
        gameActive = false;
    }
}
function toggleGameUI(bool) {
    const containers = mainSection.querySelectorAll('.container');
    if (bool) {
        mainSection.classList.add('hide');
        setTimeout(() => {
            containers.forEach(container => container.style.display = 'none');
            game_container.style.display = 'flex';
        }, 500);
    } else {
        mainSection.classList.remove('hide');
        setTimeout(() => {
            containers.forEach(container => container.style.display = 'flex');
            game_container.style.display = 'none';
        }, 500);
    }
}



function getCoinDetails(coin) {
    if (!coin || !coin.position || !coin.scale) {
        console.error('Invalid coin object passed.');
        return null;
    }

    const coinDetails = {
        ySpeed: coin.userData.ySpeed || 0,
        scale: coin.scale.x, // Assuming uniform scaling
        zLocation: coin.position.z,
    };
    return coinDetails;
}
function updateScore(coinDetails) {
    if (coinDetails === null) {
        const finalScore = -1;
        score += finalScore;
        game_score_value.innerText = score.toFixed(2);
        console.log(score);
        return finalScore;
    }

    if (!coinDetails || !coinDetails.ySpeed || !coinDetails.scale || !coinDetails.zLocation) {
        console.error('Invalid coin details passed.');
        return null;
    }

    const baseScore = 10;
    const speedMultiplier = coinDetails.ySpeed / gravity; // Higher gravity multiplier = higher speed multiplier
    const sizeMultiplier = maxScale / coinDetails.scale; // Smaller scale = bigger points multiplier
    const distanceMultiplier = Math.abs(minZ - coinDetails.zLocation) / Math.abs(minZ - maxZ); // More negative Z = higher multiplier
    const scoreMultiplier = speedMultiplier * sizeMultiplier * distanceMultiplier;
    const finalScore = baseScore * scoreMultiplier;

    score += finalScore;
    game_score_value.innerText = score.toFixed(2);
    console.log(score);
    return finalScore;
}
