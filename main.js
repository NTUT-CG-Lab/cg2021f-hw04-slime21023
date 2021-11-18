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

const modelFile = [
    {
        name: 'kizunaai',
        url: 'models/mmd/KizunaAI_ver1.01/KizunaAI_ver1.01/kizunaai.pmx'
    },
    {
        name: 'Kokoro-Amamiya',
        url: 'models/mmd/『天宮こころ(Kokoro Amamiya)』/『天宮こころ(Kokoro Amamiya)』.pmx'
    }
]
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

const standardlist = {
    eyebrow_troubled_left: 0,
    eyebrow_troubled_right: 0,
    eyebrow_angry_left: 0,
    eyebrow_angry_right: 0,
    eyebrow_serious_left: 0,
    eyebrow_serious_right: 0,
    eyebrow_happy_left: 0,
    eyebrow_happy_right: 0,
    eyebrow_lowered_left: 0,
    eyebrow_lowered_right: 0,
    eyebrow_raised_left: 0,
    eyebrow_raised_right: 0,
    eye_wink_left: 0,
    eye_wink_right: 0,
    eye_happy_wink_left: 0,
    eye_happy_wink_right: 0,
    eye_relaxed_left: 0,
    eye_relaxed_right: 0,
    eye_unimpressed_left: 0,
    eye_unimpressed_right: 0,
    eye_raised_lower_eyelid_left: 0,
    eye_raised_lower_eyelid_right: 0,
    eye_surprised_left: 0,
    eye_surprised_right: 0,
    iris_small_left: 0,
    iris_small_right: 0,
    mouth_aaa: 0,
    mouth_iii: 0,
    mouth_uuu: 0,
    mouth_eee: 0,
    mouth_ooo: 0,
    mouth_delta: 0,
    mouth_smirk: 0,
    mouth_raised_corner_left: 0,
    mouth_raised_corner_right: 0,
    mouth_lowered_corner_left: 0,
    mouth_lowered_corner_right: 0
}

const loadModels = async () => {
    const onProgress = xhr => {
        if (xhr.lengthComputable) {
            const percentComplete = xhr.loaded / xhr.total * 100
            console.log(`${Math.round(percentComplete, 2)}% downloaded`)
        }
    }

    const loadModel = ({ url, name }) => new Promise(resolve => {
        const loader = new MMDLoader()
        const loadVpd = vpdFile => new Promise(resolve => {
            loader.loadVPD(vpdFile, false, vpd => resolve(vpd), onProgress, null)
        })

        loader.load(url, model => {
            model.position.y = -10
            model.userData = { name }
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

    // initKeys 
    const keys = Object.keys(dictionary)
    // initControls 
    keys.forEach((key, index) => { controls[`${key}-${index}`] = 0.0 })
    controls.pose = - 1
    vpdFiles.forEach(file => { controls[getBaseName(file)] = false })


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
            mesh.morphTargetInfluences[index] = controls[`${key}-${index}`]
        })
    }
    keys.forEach((key, index) => {
        morphs.add(controls, `${key}-${index}`, 0.0, 1.0, 0.01).onChange(onChangeMorph)
    })

    onChangeMorph()
    onChangePose()
    poses.open()
    morphs.open()

    const destroy = () => { gui.destroy() }
    return destroy
}

const initGui2 = (name) => {
    const gui = new GUI()
    const controls = {}
    const stdlist = gui.addFolder('stdlist')
    const keys = Object.keys(standardlist)
    keys.forEach(key => { controls[key] = -1 })

    const stdlocal = []
    const onChangeLocal = () => {
        keys.forEach((key, index) => {
            const value = controls[key]
            stdlocal[index] = value
        })
    }

    keys.forEach(key => { stdlist.add(controls, key).onChange(onChangeLocal) })
    stdlist.open()

    const keydownP = ({ key }) => {
        if (key != 'p' && key != 'P') return
        keys.forEach(key => { console.log(`${key} : ${controls[key]}`) })
    }

    const keydownS = ({ key }) => {
        if (key != 's' && key != 'S') return
        const a = document.createElement('a')
        const filename = `${name}-std.json`
        const content = {}
        keys.forEach((k, index) => { content[index] = controls[k] })

        const array = [JSON.stringify(content)]
        const file = new Blob(array, { type: 'application/json' })

        a.href = URL.createObjectURL(file)
        a.download = filename
        a.click()
        URL.revokeObjectURL(a.href)
    }

    window.addEventListener('keydown', keydownP)
    window.addEventListener('keydown', keydownS)

    const destroy = () => {
        gui.destroy()
        window.removeEventListener('keydown', keydownP)
        window.removeEventListener('keydown', keydownS)
    }
    return destroy
}

const init = (models) => {
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

    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        effect.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onWindowResize)

    const len = models.length
    let mesh, des, des2
    let modelIndex = 0
    const setModel = index => {
        if (mesh) scene.remove(mesh)
        if (des) des()
        if (des2) des2()

        mesh = models[index]
        scene.add(mesh)
        des = initGui(mesh)
        des2 = initGui2(mesh.userData.name)
    }

    setModel(modelIndex)
    window.addEventListener('keydown', ({ key }) => {
        if (key != 'a' && key != 'A') return
        setModel(Math.abs(--modelIndex) % len)
    })

    window.addEventListener('keydown', ({ key }) => {
        if (key != 'd' && key != 'D') return
        setModel(Math.abs(++modelIndex) % len)
    })

    const animate = () => {
        requestAnimationFrame(animate)
        effect.render(scene, camera)
    }
    return animate
}