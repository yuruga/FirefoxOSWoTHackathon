(function(global){

    var Config = {
        RANDOM_HALF_SIZE: 10,
        FRICTION: 0.8,
        HIGH_POINT_Y: 2000,
        LOW_POINT_Y: -2000
    };


    var scene, camera, renderer;
    var geometry, material, mesh, particles;

    //初期設定
    function init() {

        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2( 0x000000, 0.001 );

        camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.position.z = 1000;

        // geometry = new THREE.BoxGeometry( 200, 200, 200 );
        // material = new THREE.MeshBasicMaterial( { color: 0x888888 } );
        //
        // mesh = new THREE.Mesh( geometry, material );
        // scene.add( mesh );


        geometry = new THREE.Geometry();

        sprite = THREE.ImageUtils.loadTexture( "textures/snow.png" );

        for ( i = 0; i < 500; i ++ ) {

            var vertex = new THREE.Vector3();
            vertex.x = 2000 * Math.random() - 1000;
            vertex.y = 2000 * Math.random() - 1000;
            vertex.z = 100 * Math.random() - 50;
            vertex.vx = Math.random() * Config.RANDOM_HALF_SIZE * 2 - Config.RANDOM_HALF_SIZE;
            vertex.vy = 0;
            vertex.vz = Math.random() * Config.RANDOM_HALF_SIZE * 2 - Config.RANDOM_HALF_SIZE;

            geometry.vertices.push( vertex );

        }

        material = new THREE.PointCloudMaterial({
            size: 35,
            sizeAttenuation: false,
            map: sprite,
            alphaTest: 0.5,
            transparent: true
        });
        // material.color.setHSL( 1.0, 1.0, 0.7 );
        material.color.setRGB( 255, 255, 255);

        particles = new THREE.PointCloud( geometry, material );
        scene.add( particles );


        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );

        document.body.appendChild( renderer.domElement );

    }

    //アニメーション
    function animate() {

        requestAnimationFrame( animate );
        //setTimeout(animate,1000/42)

        // mesh.rotation.x += 0.01;
        // mesh.rotation.y += 0.02;

        var vertices = [];
        for(var i in geometry.vertices){
            geometry.vertices[i].vx *= Config.FRICTION;
            geometry.vertices[i].vz *= Config.FRICTION;

            geometry.vertices[i].x += geometry.vertices[i].vx;
            geometry.vertices[i].y += -4.5;
            geometry.vertices[i].z += geometry.vertices[i].vz;

            if(geometry.vertices[i].y > Config.LOW_POINT_Y){
                vertices.push(geometry.vertices[i]);
            }
        }
        geometry.vertices = vertices;
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


    //ウィンドウイベント登録
    global.addEventListener('load', function() {
        init();
        animate();
    });
    global.addEventListener('resize', onWindowResize, false);

})(window);
