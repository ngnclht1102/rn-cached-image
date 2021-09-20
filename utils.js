import RNFetchBlob from 'react-native-fetch-blob'
import sha1 from 'sha1'

const randomName = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
const BASE_DIR = RNFetchBlob.fs.dirs.CacheDir

export function getPath (uri, immutable) {
  let path = uri.substring(uri.lastIndexOf('/'))
  path = path.indexOf('?') === -1 ? path : path.substring(path.lastIndexOf('.'), path.indexOf('?'))
  const ext = path.indexOf('.') === -1 ? '.jpg' : path.substring(path.indexOf('.'))
  if (immutable === true) {
    return BASE_DIR + '/' + sha1(uri) + ext
  } else {
    return BASE_DIR + '/' + randomName() + randomName() + '-' + randomName() + '-' + randomName() + '-' + randomName() + '-' + randomName() + randomName() + randomName() + ext
  }
}
export async function cacheValid(path, maxAgeInHours) {
  try {
    const existed = await RNFetchBlob.fs.exists(path)
    stats = await RNFetchBlob.fs.stat(path)
    const ageInHours = Math.floor((Date.now() - stats.lastModified )) /1000 / 3600
    console.log('maxAgeInHours < ageInHours: '+ maxAgeInHours + '  ' + ageInHours)
    if (maxAgeInHours < ageInHours) {
      await RNFetchBlob.fs.unlink(path)
      return false
    }
    return existed
  } catch (e) {
    return false
  }
}
