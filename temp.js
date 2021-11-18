
import * as THREE from './build/three.module.js';

import { GUI } from './jsm/libs/dat.gui.module.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import { OutlineEffect } from './jsm/effects/OutlineEffect.js';
import { MMDLoader } from './jsm/loaders/MMDLoader.js';
import { MMDAnimationHelper } from './jsm/animation/MMDAnimationHelper.js';

let camera, scene, renderer, effect;
let mesh, helper;

const vpds = [];


var standardlist = {
    eyebrow_troubled_left: 0, eyebrow_troubled_right: 0, eyebrow_angry_left: 0, eyebrow_angry_right: 0, eyebrow_serious_left: 0, eyebrow_serious_right: 0, eyebrow_happy_left: 0
    , eyebrow_happy_right: 0, eyebrow_lowered_left: 0, eyebrow_lowered_right: 0, eyebrow_raised_left: 0, eyebrow_raised_right: 0, eye_wink_left: 0
    , eye_wink_right: 0, eye_happy_wink_left: 0, eye_happy_wink_right: 0, eye_relaxed_left: 0, eye_relaxed_right: 0, eye_unimpressed_left: 0
    , eye_unimpressed_right: 0
    , eye_raised_lower_eyelid_left: 0, eye_raised_lower_eyelid_right: 0, eye_surprised_left: 0, eye_surprised_right: 0, iris_small_left: 0, iris_small_right: 0
    , mouth_aaa: 0, mouth_iii: 0, mouth_uuu: 0, mouth_eee: 0, mouth_ooo: 0, mouth_delta: 0, mouth_smirk: 0, mouth_raised_corner_left: 0, mouth_raised_corner_right: 0, mouth_lowered_corner_left: 0, mouth_lowered_corner_right: 0
};

var textarray = ['eyebrow_troubled_left', 'eyebrow_troubled_right', 'eyebrow_angry_left', 'eyebrow_angry_right'
    , 'eyebrow_serious_left', 'eyebrow_serious_right', 'eyebrow_happy_left', 'eyebrow_happy_right', 'eyebrow_lowered_left', 'eyebrow_lowered_right'
    , 'eyebrow_raised_left', 'eyebrow_raised_right', 'eye_wink_left', 'eye_wink_right', 'eye_happy_wink_left', 'eye_happy_wink_right', 'eye_relaxed_left'
    , 'eye_relaxed_right', 'eye_unimpressed_left', 'eye_unimpressed_right', 'eye_raised_lower_eyelid_left', 'eye_raised_lower_eyelid_right', 'eye_surprised_left'
    , 'eye_surprised_right', 'iris_small_left', 'iris_small_right', 'mouth_aaa', 'mouth_iii', 'mouth_uuu', 'mouth_eee', 'mouth_ooo', 'mouth_delta', 'mouth_smirk'
    , 'mouth_raised_corner_left', 'mouth_raised_corner_right', 'mouth_lowered_corner_left', 'mouth_lowered_corner_right'];


Ammo().then(function (AmmoLib) {

    Ammo = AmmoLib;
    initGui2()
    init();
    animate();

});

const initGui2 = () => {
    const gui = new GUI()
    const controls = {}
    const stdlist = gui.addFolder('stdlist')
    for (const key in standardlist) {
        controls[key] = -1
    }

    const stdlocal = []
    const onChangeLocal = () => {
        textarray.forEach(key => {
            const value = controls[key]
            stdlocal[i] = value
        })
    }

    for (const key in standardlist) {
        stdlist.add(controls, key).onChange(onChangeLocal)
    }
    stdlist.open()

}

function init() {

    const container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 30;

    // scene

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const ambient = new THREE.AmbientLight(0x666666);
    scene.add(ambient);

    const directionalLight = new THREE.DirectionalLight(0x887766);
    directionalLight.position.set(- 1, 1, 1).normalize();
    scene.add(directionalLight);

    //

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    effect = new OutlineEffect(renderer);

    // model

    function onProgress(xhr) {

        if (xhr.lengthComputable) {

            const percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + '% downloaded');

        }

    }

    const modelFile = 'models/mmd/KizunaAI_ver1.01/KizunaAI_ver1.01/kizunaai.pmx';
    //const modelFile = 'models/mmd/miku/miku_v2.pmd';
    const vpdFiles = [
        'models/mmd/vpds/01.vpd',
        'models/mmd/vpds/02.vpd',
        'models/mmd/vpds/03.vpd',
        'models/mmd/vpds/04.vpd',
        'models/mmd/vpds/05.vpd',
        'models/mmd/vpds/06.vpd',
        'models/mmd/vpds/07.vpd',
        'models/mmd/vpds/08.vpd',
        //'models/mmd/vpds/09.vpd',
        //'models/mmd/vpds/10.vpd',
        'models/mmd/vpds/11.vpd'
    ];

    helper = new MMDAnimationHelper();

    const loader = new MMDLoader();

    loader.load(modelFile, function (object) {

        mesh = object;
        mesh.position.y = - 10;

        scene.add(mesh);

        let vpdIndex = 0;

        function loadVpd() {

            const vpdFile = vpdFiles[vpdIndex];

            loader.loadVPD(vpdFile, false, function (vpd) {

                vpds.push(vpd);

                vpdIndex++;

                if (vpdIndex < vpdFiles.length) {

                    loadVpd();

                } else {

                    initGui();

                }

            }, onProgress, null);

        }

        loadVpd();

    }, onProgress, null);
    //鏡頭控制
    const cameracontrols = new OrbitControls(camera, renderer.domElement);
    cameracontrols.minDistance = 10;
    cameracontrols.maxDistance = 100;
    cameracontrols.enableRotate = false;
    //

    window.addEventListener('resize', onWindowResize);

    function initGui() {

        const gui = new GUI();

        const dictionary = mesh.morphTargetDictionary;

        const controls = {};
        const keys = [];

        const poses = gui.addFolder('Poses');
        const morphs = gui.addFolder('Morphs');

        function getBaseName(s) {

            return s.slice(s.lastIndexOf('/') + 1);

        }

        function initControls() {

            for (const key in dictionary) {

                controls[key] = 0.0;

            }

            controls.pose = - 1;

            for (let i = 0; i < vpdFiles.length; i++) {

                controls[getBaseName(vpdFiles[i])] = false;

            }

        }

        function initKeys() {

            for (const key in dictionary) {

                keys.push(key);

            }

        }

        function initPoses() {

            const files = { default: - 1 };

            for (let i = 0; i < vpdFiles.length; i++) {

                files[getBaseName(vpdFiles[i])] = i;

            }

            poses.add(controls, 'pose', files).onChange(onChangePose);

        }

        function initMorphs() {

            for (const key in dictionary) {

                morphs.add(controls, key, 0.0, 1.0, 0.01).onChange(onChangeMorph);

            }

        }

        function onChangeMorph() {

            for (let i = 0; i < keys.length; i++) {

                const key = keys[i];
                const value = controls[key];
                mesh.morphTargetInfluences[i] = value;

            }

        }

        function onChangePose() {

            const index = parseInt(controls.pose);

            if (index === - 1) {

                mesh.pose();

            } else {

                helper.pose(mesh, vpds[index]);

            }

        }

        initControls();
        initKeys();
        initPoses();
        initMorphs();

        onChangeMorph();
        onChangePose();

        poses.open();
        morphs.open();
    }

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    effect.setSize(window.innerWidth, window.innerHeight);

}

//

function animate() {

    requestAnimationFrame(animate);
    render();

}

function render() {

    effect.render(scene, camera);

}
