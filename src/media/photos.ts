import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

import { uid } from '@/db/client';

/**
 * Photos for custom exercises.
 *
 * The camera is the app's only permission. Photos are captured, copied into the
 * app's own document directory and referenced by a stable file URI — the
 * picker's temporary cache file is not safe to keep, since iOS clears it.
 *
 * Nothing here touches the network. Photos never leave the device.
 */

const PHOTO_DIRECTORY = 'exercise-photos';

function photoDirectory(): Directory {
  const dir = new Directory(Paths.document, PHOTO_DIRECTORY);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

/**
 * Take a photo with the camera and keep a permanent copy.
 *
 * Returns the stored file URI, or `null` if the user cancelled or declined the
 * permission. A declined permission explains itself once and offers Settings —
 * it never nags on every attempt.
 */
export async function captureExercisePhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    if (permission.canAskAgain === false) {
      Alert.alert(
        'Camera access is off',
        'Turn on camera access in Settings to add a photo to this exercise.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => void Linking.openSettings() },
        ],
      );
    }
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    // Square, to match the tile it will be shown in.
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    exif: false,
  });

  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;

  try {
    const source = new File(asset.uri);
    const destination = new File(photoDirectory(), `${uid()}.jpg`);
    source.copySync(destination);
    return destination.uri;
  } catch (error) {
    Alert.alert('Could not save the photo', 'Please try taking it again.');
    console.warn('[repa] failed to store exercise photo', error);
    return null;
  }
}

/** Remove a stored photo file. Missing files are not an error. */
export function deletePhotoFile(uri: string | null | undefined): void {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('[repa] failed to delete exercise photo', error);
  }
}

/**
 * Delete every stored photo. Used by "Delete all data", which must not leave
 * image files behind after the database rows that referenced them are gone.
 */
export function deleteAllPhotos(): void {
  try {
    const dir = new Directory(Paths.document, PHOTO_DIRECTORY);
    if (dir.exists) dir.delete();
  } catch (error) {
    console.warn('[repa] failed to clear exercise photos', error);
  }
}
