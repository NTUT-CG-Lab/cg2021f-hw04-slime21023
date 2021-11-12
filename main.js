
import {
    PerspectiveCamera,
    Scene,
    Color,
    AmbientLight,
    DirectionalLight,
    WebGLRenderer
} from './build/three.module.js';

import { GUI } from './jsm/libs/dat.gui.module.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import { OutlineEffect } from './jsm/effects/OutlineEffect.js';
import { MMDLoader } from './jsm/loaders/MMDLoader.js';
import { MMDAnimationHelper } from './jsm/animation/MMDAnimationHelper.js';

const modelFile = ['models/mmd/KizunaAI_ver1.01/KizunaAI_ver1.01/kizunaai.pmx']
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
]

const loadModels = async () => {
    const onProgress = xhr => {
        if (xhr.lengthComputable) {
            const percentComplete = xhr.loaded / xhr.total * 100
            console.log(`${Math.round(percentComplete, 2)}% downloaded`)
        }
    }



    const loadModel = url => new Promise(resolve => {
        const loader = new MMDLoader()
        const loadVpd = vpdFile => new Promise(resolve => {
            loader.loadVPD(vpdFile, false, vpd => resolve(vpd), onProgress, null)
        })

        loader.load(url, model => {
            model.position.y = -10

            const loadFiles = vpdFiles.map(loadVpd)
            Promise.all(loadFiles).then(vpds => {
                model.vpds = vpds
                resolve(model)
            })
        }, onProgress, null)
    })

    return await Promise.all(modelFile.map(loadModel))
}

Ammo().then(AmmoLib => {
    Ammo = AmmoLib
    loadModels().then(models => {
        const animate = init(models)
        animate()
    })
})



const initGui = mesh => {
    const helper = new MMDAnimationHelper()
    const gui = new GUI()
    const dictionary = mesh.morphTargetDictionary
    const getBaseName = s => s.slice(s.lastIndexOf('/') + 1)
    const poses = gui.addFolder('Poses')
    const morphs = gui.addFolder('Morphs')
    const controls = {}

    // initControls 
    Object.keys(dictionary).forEach(key => { controls[key] = 0.0 })
    controls.pose = - 1
    vpdFiles.forEach(file => { controls[getBaseName(file)] = false })

    // initKeys 
    const keys = Object.keys(dictionary)

    // initPoses
    const onChangePose = () => {
        const index = parseInt(controls.pose)
        if (index === -1) { mesh.pose() }
        else { helper.pose(mesh, vpds[index]) }
    }
    const files = { default: -1 }
    vpdFiles.forEach((file, index) => { files[getBaseName(file)] = index })
    poses.add(controls, 'pose', files).onChange(onChangePose)

    // initMorphs 
    const onChangeMorph = () => {
        keys.forEach((key, index) => {
            mesh.morphTargetInfluences[index] = controls[key]
        })
    }
    keys.forEach(key => {
        morphs.add(controls, key, 0.0, 1.0, 0.01).onChange(onChangeMorph)
    })

    onChangeMorph()
    onChangePose()
    poses.open()
    morphs.open()
}


const init = (models) => {
    // const models = await loadModels()
    const container = document.createElement('div')
    document.body.appendChild(container)

    const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000)
    camera.position.z = 30

    const scene = new Scene()
    scene.background = new Color(0xffffff)
    const ambient = new AmbientLight(0x666666)
    scene.add(ambient)

    const directionalLight = new DirectionalLight(0x887766)
    directionalLight.position.set(-1, 1, 1).normalize()
    scene.add(directionalLight)

    const renderer = new WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    container.appendChild(renderer.domElement)

    const effect = new OutlineEffect(renderer)
    const camCtrls = new OrbitControls(camera, renderer.domElement)
    camCtrls.minDistance = 10
    camCtrls.maxDistance = 100
    camCtrls.enableRotate = false

    const mesh = models[0]
    scene.add(mesh)
    initGui(mesh)

    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        effect.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', onWindowResize)

    const animate = () => {
        requestAnimationFrame(animate)
        effect.render(scene, camera)
    }
    return animate
}