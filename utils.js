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
