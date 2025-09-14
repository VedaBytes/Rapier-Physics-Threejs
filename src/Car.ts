import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default class Car {
  dynamicBodies: [THREE.Object3D, RAPIER.RigidBody][] = [];
  world;
  constructor(world: RAPIER.World) {
    this.world = world;
  }

  async loadCar(scene: THREE.Scene, position: [number, number, number]) {
    await new GLTFLoader().loadAsync("/Models/race.glb").then((gltf) => {
      const carMesh = gltf.scene.getObjectByName("body") as THREE.Group;

      console.log(gltf.scene);

      carMesh.position.set(0, 0, 0);

      carMesh.traverse((o) => {
        o.castShadow = true;
      });

      const wheelBLeft = gltf.scene.getObjectByName(
        "wheel-back-left"
      ) as THREE.Group;
      const wheelBRight = gltf.scene.getObjectByName(
        "wheel-back-right"
      ) as THREE.Group;
      const wheelFLeft = gltf.scene.getObjectByName(
        "wheel-front-left"
      ) as THREE.Group;
      const wheelFRight = gltf.scene.getObjectByName(
        "wheel-front-right"
      ) as THREE.Group;

      wheelBLeft.position.set(0, 0, 0);
      wheelBRight.position.set(0, 0, 0);
      wheelFLeft.position.set(0, 0, 0);
      wheelFRight.position.set(0, 0, 0);

      scene.add(gltf.scene);

      scene.add(carMesh, wheelBLeft, wheelBRight, wheelFLeft, wheelFRight);

      const carBody = this.world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(...position)
          .setCanSleep(false)
      );

      const wheelBLBody = this.world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(-1 + position[0], 1 + position[1], 1 + position[2])
          .setCanSleep(false)
      );

      const wheelBRBody = this.world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(1 + position[0], 1 + position[1], 1 + position[2])
          .setCanSleep(false)
      );

      const wheelFLBody = this.world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(-1 + position[0], 1 + position[1], -1 + position[2])
          .setCanSleep(false)
      );

      const wheelFRBody = this.world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(1 + position[0], 1 + position[1], -1 + position[2])
          .setCanSleep(false)
      );

      const v = new THREE.Vector3();
      let positions: number[] = [];
      carMesh.updateMatrixWorld(true); // ensure world matrix is up to date
      carMesh.traverse((o) => {
        if (o.type === "Mesh") {
          const positionAttribute = (o as THREE.Mesh).geometry.getAttribute(
            "position"
          );
          for (let i = 0, l = positionAttribute.count; i < l; i++) {
            v.fromBufferAttribute(positionAttribute, i);
            v.applyMatrix4((o.parent as THREE.Object3D).matrixWorld);
            positions.push(...v);
          }
        }
      });

      const carShape = RAPIER.ColliderDesc.convexHull(
        new Float32Array(positions)
      ) as RAPIER.ColliderDesc;

      const wheelFLShape = RAPIER.ColliderDesc.cylinder(0.15, 0.3)
        .setRotation(
          new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 0, 1),
            Math.PI / 2
          )
        )
        .setTranslation(0.15, 0, 0)
        .setRestitution(0.5);

      const wheelBLShape = RAPIER.ColliderDesc.cylinder(0.15, 0.3)
        .setRotation(
          new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 0, 1),
            Math.PI / 2
          )
        )
        .setTranslation(0.15, 0, 0)
        .setRestitution(0.5);

      const wheelBRShape = RAPIER.ColliderDesc.cylinder(0.1, 0.3)
        .setRotation(
          new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 0, 1),
            Math.PI / 2
          )
        )
        .setTranslation(-0.15, 0, 0)
        .setRestitution(0.5);

      const wheelFRShape = RAPIER.ColliderDesc.cylinder(0.15, 0.3)
        .setRotation(
          new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 0, 1),
            Math.PI / 2
          )
        )
        .setTranslation(-0.15, 0, 0)
        .setRestitution(0.5);

      this.world.createCollider(carShape, carBody);
      this.world.createCollider(wheelBLShape, wheelBLBody);
      this.world.createCollider(wheelBRShape, wheelBRBody);
      this.world.createCollider(wheelFLShape, wheelFLBody);
      this.world.createCollider(wheelFRShape, wheelFRBody);

      this.world.createImpulseJoint(
        RAPIER.JointData.revolute(
          new RAPIER.Vector3(0.55, 0.2, 0.63),
          new RAPIER.Vector3(0, 0, 0),
          new RAPIER.Vector3(-1, 0, 0)
        ),
        carBody,
        wheelBLBody,
        true
      );

      this.world.createImpulseJoint(
        RAPIER.JointData.revolute(
          new RAPIER.Vector3(-0.55, 0.2, 0.63),
          new RAPIER.Vector3(0, 0, 0),
          new RAPIER.Vector3(1, 0, 0)
        ),
        carBody,
        wheelBRBody,
        true
      );

      this.world.createImpulseJoint(
        RAPIER.JointData.revolute(
          new RAPIER.Vector3(0.55, 0.2, -0.88),
          new RAPIER.Vector3(0, 0, 0),
          new RAPIER.Vector3(1, 0, 0)
        ),
        carBody,
        wheelFLBody,
        true
      );

      this.world.createImpulseJoint(
        RAPIER.JointData.revolute(
          new RAPIER.Vector3(-0.55, 0.2, -0.88),
          new RAPIER.Vector3(0, 0, 0),
          new RAPIER.Vector3(-1, 0, 0)
        ),
        carBody,
        wheelFRBody,
        true
      );

      console.log("WheelBL mesh:", wheelBLeft.position);
      console.log("WheelBL body:", wheelBLBody.translation());

      console.log("WheelBR mesh:", wheelBRight.position);
      console.log("WheelBR body:", wheelBRBody.translation());

      console.log("WheelFL mesh:", wheelFLeft.position);
      console.log("WheelFL body:", wheelFLBody.translation());

      console.log("WheelFR mesh:", wheelFRight.position);
      console.log("WheelFR body:", wheelFRBody.translation());

      // this.world.createImpulseJoint(
      //   RAPIER.JointData.revolute(
      //     new RAPIER.Vector3(0.95, 0, 0.63),
      //     new RAPIER.Vector3(0, 0, 0),
      //     new RAPIER.Vector3(1, 0, 0)
      //   ),
      //   carBody,
      //   wheelFRBody,
      //   true
      // );

      // attach wheels to car using Rapier revolute

      this.dynamicBodies.push([carMesh, carBody]);
      this.dynamicBodies.push([wheelBLeft, wheelBLBody]);
      this.dynamicBodies.push([wheelBRight, wheelBRBody]);
      this.dynamicBodies.push([wheelFLeft, wheelFLBody]);
      this.dynamicBodies.push([wheelFRight, wheelFRBody]);
    });
  }
  update() {
    for (let i = 0, n = this.dynamicBodies.length; i < n; i++) {
      this.dynamicBodies[i][0].position.copy(
        this.dynamicBodies[i][1].translation()
      );
      this.dynamicBodies[i][0].quaternion.copy(
        this.dynamicBodies[i][1].rotation()
      );
    }
  }
}
