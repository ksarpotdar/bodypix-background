const {Tensor3D, tensor3d, util} = require('@tensorflow/tfjs-core');
const jpeg = require('jpeg-js');

/**
 * Decode a JPEG-encoded image to a 3D Tensor of dtype `int32`.
 *
 * ```js
 * const image = require('path/to/img.jpg');
 * const imageAssetPath = Image.resolveAssetSource(image);
 * const response = await fetch(imageAssetPath.uri, {}, { isBinary: true });
 * const rawImageData = await response.arrayBuffer();
 * const imageTensor = decodeJpeg(rawImageData);
 * ```
 *
 * @param contents The JPEG-encoded image in an Uint8Array.
 * @param channels An optional int. Defaults to 3. Accepted values are
 *     0: use the number of channels in the JPG-encoded image.
 *     1: output a grayscale image.
 *     3: output an RGB image.
 * @returns A 3D Tensor of dtype `int32` with shape [height, width, 1/3].
 */
/** @doc {heading: 'Media', subheading: 'Images'} */
function decodeJpeg(
    contents, channels = 3) {
  util.assert(
      getImageType(contents) === 'jpeg',
      () => 'The passed contents are not a valid JPEG image');
  util.assert(
      channels === 3, () => 'Only 3 channels is supported at this time');
  const TO_UINT8ARRAY = true;
  const {width, height, data} = jpeg.decode(contents, TO_UINT8ARRAY);
  // Drop the alpha channel info because jpeg.decode always returns a typedArray
  // with 255
  const buffer = new Uint8Array(width * height * 3);
  let offset = 0;  // offset into original data
  for (let i = 0; i < buffer.length; i += 3) {
    buffer[i] = data[offset];
    buffer[i + 1] = data[offset + 1];
    buffer[i + 2] = data[offset + 2];

    offset += 4;
  }

  return tensor3d(buffer, [height, width, channels]);
}

/**
 * Helper function to get image type based on starting bytes of the image file.
 */
function getImageType(content) {
  // Classify the contents of a file based on starting bytes (aka magic number:
  // tslint:disable-next-line:max-line-length
  // https://en.wikipedia.org/wiki/Magic_number_(programming)#Magic_numbers_in_files)
  // This aligns with TensorFlow Core code:
  // tslint:disable-next-line:max-line-length
  // https://github.com/tensorflow/tensorflow/blob/4213d5c1bd921f8d5b7b2dc4bbf1eea78d0b5258/tensorflow/core/kernels/decode_image_op.cc#L44
  if (content.length > 3 && content[0] === 255 && content[1] === 216 &&
      content[2] === 255) {
    // JPEG byte chunk starts with `ff d8 ff`
    return 'jpeg';
  } else if (
      content.length > 4 && content[0] === 71 && content[1] === 73 &&
      content[2] === 70 && content[3] === 56) {
    // GIF byte chunk starts with `47 49 46 38`
    return 'gif';
  } else if (
      content.length > 8 && content[0] === 137 && content[1] === 80 &&
      content[2] === 78 && content[3] === 71 && content[4] === 13 &&
      content[5] === 10 && content[6] === 26 && content[7] === 10) {
    // PNG byte chunk starts with `\211 P N G \r \n \032 \n (89 50 4E 47 0D 0A
    // 1A 0A)`
    return 'png';
  } else if (content.length > 3 && content[0] === 66 && content[1] === 77) {
    // BMP byte chunk starts with `42 4d`
    return 'bmp';
  } else {
    throw new Error(
        'Expected image (JPEG, PNG, or GIF), but got unsupported image type');
  }
}

module.exports = {
  decodeJpeg
}
