import { useRef, useEffect, MutableRefObject } from "react";
import { useFrame, useThree } from "react-three-fiber";
import { config, useSpring } from "react-spring";
import { Quaternion, Vector3, Vector2, Euler } from "three";
import { useEnvironment } from "../utils/hooks";

type DragControlsProps = {
  quaternion: MutableRefObject<Quaternion>;
  position: MutableRefObject<Vector3>;
};

const DRAG_SENSITIVITY = new Vector2(0.16, 0.16);
const HOVER_SENSITIVITY = new Vector2(0.02, 0.02);

/**
 * DragControls allows for a click-and-drag control
 * of the camera
 *
 * @param props
 * @constructor
 */
const DragControls = (props: DragControlsProps) => {
  const { quaternion, position } = props;

  const originEuler = useRef<Euler>(new Euler(0, 0, 0, "YXZ"));
  const setEuler = useRef<Euler>(new Euler(0, 0, 0, "YXZ"));
  const mouseDownPos = useRef<Vector2>(new Vector2(0, 0));
  const dragging = useRef(false);
  const { camera } = useThree();
  const { containerRef } = useEnvironment();

  const [spring, setSpring] = useSpring(() => ({
    xyz: [0, 0, 0],
    config: config.default,
  }));

  useFrame(() => {
    if (position.current) {
      const { x: pX, y: pY, z: pZ } = position.current;
      camera?.position?.set(pX, pY, pZ);
    }

    if (setEuler.current) {
      // @ts-ignore
      const newVals = spring.xyz.interpolate((x, y, z) => [x, y, z]);
      // @ts-ignore
      const newX = newVals.payload[0].value;
      // @ts-ignore
      const xVel = newVals.payload[0].lastVelocity || 0;
      // @ts-ignore
      const newY = newVals.payload[1].value;
      // @ts-ignore
      const yVel = newVals.payload[1].lastVelocity || 0;
      // @ts-ignore
      const newZ = newVals.payload[2].value;
      // @ts-ignore
      const zVel = newVals.payload[2].lastVelocity || 0;
      setEuler.current.set(newX, newY, newZ);
      camera.quaternion.setFromEuler(setEuler.current);
    }
  });

  const getNewEuler = (
    dragX: number,
    dragY: number,
    isHover?: boolean
  ): Euler => {
    const newEuler = originEuler.current.clone();
    const moveX = dragX - mouseDownPos.current.x;
    const moveY = dragY - mouseDownPos.current.y;

    const SENSITIVITY = isHover ? HOVER_SENSITIVITY : DRAG_SENSITIVITY;

    newEuler.setFromQuaternion(camera.quaternion);
    newEuler.y = originEuler.current.y - (moveX * SENSITIVITY.x) / 100;
    newEuler.x = originEuler.current.x - (moveY * SENSITIVITY.y) / 100;
    // newEuler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, newEuler.x));

    return newEuler;
  };

  // touch move scripts
  const onMouseDown = (ev: MouseEvent) => {
    dragging.current = true;
    mouseDownPos.current.set(ev.clientX, ev.clientY);
    containerRef?.current?.classList.add("grabbing");
  };
  const onMouseMove = (ev: MouseEvent) => {
    const newEuler = getNewEuler(ev.clientX, ev.clientY, !dragging.current);
    setSpring({ xyz: newEuler.toArray() });
    quaternion.current = camera.quaternion;
  };
  const onMouseUp = (ev: MouseEvent) => {
    dragging.current = false;
    originEuler.current = getNewEuler(ev.clientX, ev.clientY);
    mouseDownPos.current.set(ev.clientX, ev.clientY);
    containerRef?.current?.classList.remove("grabbing");
  };

  useEffect(() => {
    quaternion.current = camera.quaternion;
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [containerRef]);

  return null;
};

export default DragControls;
