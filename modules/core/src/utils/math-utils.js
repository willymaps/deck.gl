// Extensions to math.gl library. Intended to be folded back.

import {Vector3} from 'math.gl';

// Helper, avoids low-precision 32 bit matrices from gl-matrix mat4.create()
export function createMat4() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

// Extract camera vectors (move to math library?)
export function extractCameraVectors({viewMatrix, viewMatrixInverse}) {
  // Read the translation from the inverse view matrix
  return {
    eye: [viewMatrixInverse[12], viewMatrixInverse[13], viewMatrixInverse[14]],
    direction: [-viewMatrix[2], -viewMatrix[6], -viewMatrix[10]],
    up: [viewMatrix[1], viewMatrix[5], viewMatrix[9]],
    right: [viewMatrix[0], viewMatrix[4], viewMatrix[8]]
  };
}

const cameraPosition = new Vector3();
const cameraDirection = new Vector3();
const cameraUp = new Vector3();
const cameraRight = new Vector3();
const nearCenter = new Vector3();
const farCenter = new Vector3();
const a = new Vector3();

/* eslint-disable max-statements */

// Extract frustum planes in common space.
// Note that common space is left-handed
// (with y pointing down)
export function getFrustumPlanes({aspect, near, far, fovyRadians, position, direction, up, right}) {
  cameraDirection.copy(direction);

  // Account for any scaling of the z axis (e.g. in
  // mercator view matrix)
  const nearFarScale = 1 / cameraDirection.len();
  cameraDirection.normalize();

  cameraPosition.copy(position);
  cameraUp.copy(up).normalize();
  cameraRight.copy(right).normalize();

  const nearHeight = 2 * Math.tan(fovyRadians / 2) * near;
  const nearWidth = nearHeight * aspect;

  nearCenter
    .copy(cameraDirection)
    .scale(near * nearFarScale)
    .add(cameraPosition);
  farCenter
    .copy(cameraDirection)
    .scale(far * nearFarScale)
    .add(cameraPosition);

  let n = cameraDirection.clone().negate();
  let d = n.dot(nearCenter);

  const planes = {
    near: {
      d,
      n
    },
    far: {
      d: cameraDirection.dot(farCenter),
      n: cameraDirection.clone()
    }
  };

  a.copy(cameraRight)
    .scale(nearWidth * 0.5)
    .add(nearCenter)
    .subtract(cameraPosition)
    .normalize();
  n = new Vector3(cameraUp).cross(a);
  d = cameraPosition.dot(n);
  planes.right = {n, d};

  a.copy(cameraRight)
    .scale(-nearWidth * 0.5)
    .add(nearCenter)
    .subtract(cameraPosition)
    .normalize();
  n = new Vector3(a).cross(cameraUp);
  d = cameraPosition.dot(n);
  planes.left = {n, d};

  a.copy(cameraUp)
    .scale(nearHeight * 0.5)
    .add(nearCenter)
    .subtract(cameraPosition)
    .normalize();
  n = new Vector3(a).cross(cameraRight);
  d = cameraPosition.dot(n);
  planes.top = {n, d};

  a.copy(cameraUp)
    .scale(-nearHeight * 0.5)
    .add(nearCenter)
    .subtract(cameraPosition)
    .normalize();
  n = new Vector3(cameraRight).cross(a);
  d = cameraPosition.dot(n);
  planes.bottom = {n, d};

  return planes;
}

/**
 * Calculate the low part of a WebGL 64 bit float
 * @param a {number} - the input float number
 * @returns {number} - the lower 32 bit of the number
 */
export function fp64LowPart(x) {
  return x - Math.fround(x);
}
