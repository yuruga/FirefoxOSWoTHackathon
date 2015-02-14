(function(global){

    var Config = {
        REQUEST_URL: 'http://localhost:8100/api/csc/',
        PARTICLE_COUNT: 500,
        FLUCT: 10,
        GRAVITY: 5,
        SPEED_MAX: 30,
        VECTOR3_RANDOM: new THREE.Vector3(2000, 2000, 2000),
        VECTOR3_MAX: new THREE.Vector3(2000, 2000, 2000),
        VECTOR3_MIN: new THREE.Vector3(-2000, -2000, -2000)
    };


    var scene, camera, renderer;
    var geometry, material, mesh, particles;
    var speed = 0;

    //初期設定
    function init() {

        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2( 0x000000, 0.001 );

        camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.position.z = 500;

        geometry = new THREE.Geometry();

        var sprite = THREE.ImageUtils.loadTexture( "textures/snow.png" );

        for ( i = 0; i < Config.PARTICLE_COUNT; ++i ) {
            var vertices = new THREE.Vector3(
                Config.VECTOR3_RANDOM.x * 2 * Math.random() - Config.VECTOR3_RANDOM.x,
                Config.VECTOR3_RANDOM.y * 2 * Math.random() - Config.VECTOR3_RANDOM.y,
                Config.VECTOR3_RANDOM.z * 2 * Math.random() - Config.VECTOR3_RANDOM.z
            )
            vertices.bx = vertices.x;
            geometry.vertices.push( vertices );
        }

        material = new THREE.PointCloudMaterial({
            size: 32,
            sizeAttenuation: true,
            map: sprite,
            alphaTest: 0.5,
            transparent: true
        });

        material.color.setRGB( 255, 255, 255);

        particles = new THREE.PointCloud( geometry, material );
        scene.add( particles );


        renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );

        document.body.appendChild( renderer.domElement );

    }

    //アニメーション
    function animate() {
        requestAnimationFrame( animate );
        for(var i in geometry.vertices){
            geometry.vertices[i].x = geometry.vertices[i].bx + Math.sin(geometry.vertices[i].y / 50) * Config.FLUCT;
            geometry.vertices[i].y -= Config.GRAVITY;
            geometry.vertices[i].z += speed;
            ['x', 'y', 'z'].map(function(prop){
                if(geometry.vertices[i][prop] > Config.VECTOR3_MAX[prop]){
                    geometry.vertices[i][prop] = geometry.vertices[i][prop] % Config.VECTOR3_MAX[prop] + Config.VECTOR3_MIN[prop];
                }else if(geometry.vertices[i][prop] < Config.VECTOR3_MIN[prop]){
                    geometry.vertices[i][prop] = geometry.vertices[i][prop] % Config.VECTOR3_MIN[prop] + Config.VECTOR3_MAX[prop];
                }
            });
        }
        geometry.verticesNeedUpdate = true;
        renderer.render( scene, camera );
    }

    //リサイズイベント
    function onWindowResize() {
        var w = window.innerWidth;
        var h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize( w, h );
    }

    //データ取得
    function fetchData(){
        var req = new XMLHttpRequest({ mozSystem: true });
        req.open('GET', Config.REQUEST_URL, true);
        req.onreadystatechange = function(e){
            if(req.readyState === 4){
                if(req.status === 200){
                    var json = JSON.parse(req.responseText);
                    if(json.hasOwnProperty('speed')){
                        speed += (json.speed - speed) * 0.5;
                    }
                }else{
                    //error
                }
                setTimeout(fetchData, 500);
            }
        };
        req.send(null);
    }


    //ウィンドウイベント登録
    global.addEventListener('load', function() {
        init();
        animate();
        fetchData();
    });
    global.addEventListener('resize', onWindowResize, false);

})(window);
