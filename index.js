/**
* Image component:
* we have 2 modes: download and cache the image and not cache as usual
* we apply some animation when image is still fetching (spinner)
* we also apply some animation when image is loaded as well.
**/
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import RNFetchBlob from 'react-native-fetch-blob'
import { Animated, Image, View, PixelRatio } from 'react-native'
import { cacheValid, getPath } from './utils'
import animationTypes from './animation.type'
import styles from './styles'

export default class RnCachedImage extends Component {
  static propTypes = {
    ...Image.propTypes,
    source: PropTypes.shape({
      uri: PropTypes.string,
    }),
    sources: PropTypes.objectOf(Image.propTypes.source),
    preferredPixelRatio: PropTypes.number,
    renderImageElement: PropTypes.func,
    onLoad: PropTypes.func,
    onError: PropTypes.func,
    placeholderSource: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
    errorPlaceholderSource: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
    animationWhileLoading: PropTypes.bool, // if disable animation on load, it will show the placeholderSource on load
    animationOnLoadEnd: PropTypes.bool, // if disable animation on load, it will show the placeholderSource on load
    animationOnLoadEndType: PropTypes.string, // one of explode, fade, shrink
    placeholderColor: PropTypes.string, // one of explode, fade, shrink
    shouldCachedImage: PropTypes.bool, // only applied when should cache image is enable
    immutableCachedImage: PropTypes.bool, // only applied when should cache image is enable
    delay: PropTypes.number, // increase the loading time by miliseconds
    reuseView: PropTypes.bool, // use only if you intergrate with recycle listview
    maxAgeInHours: PropTypes.number, // max age of the cached file
  };

  static defaultProps = {
    animationWhileLoading: true,
    animationOnLoadEnd: true,
    animationOnLoadEndType: animationTypes.ANIM_TYPE_SHRINK,
    placeholderColor: '#e0e5e5',
    shouldCachedImage: false,
    immutableCachedImage: true,
    delay: 500,
    maxAgeInHours: 72, // 3 days
    preferredPixelRatio: PixelRatio.get()
  };

  static getClosestHighQualitySource(sources, preferredPixelRatio) {
    let pixelRatios = Object.keys(sources);
    if (!pixelRatios.length) {
      return null;
    }

    pixelRatios.sort((ratioA, ratioB) =>
      parseFloat(ratioA) - parseFloat(ratioB)
    );
    for (let ii = 0; ii < pixelRatios.length; ii++) {
      if (pixelRatios[ii] >= preferredPixelRatio) {
        return sources[pixelRatios[ii]];
      }
    }

    let largestPixelRatio = pixelRatios[pixelRatios.length - 1];
    return sources[largestPixelRatio];
  }

  static getSize (...args) {
    return Image.getSize(...args)
  }

  constructor (...props) {
    super(...props)

    this.state = {
      opacity: new Animated.Value(0),
      holderSpinnerOpacity: new Animated.Value(1),
      holderSpinnerScale: new Animated.Value(1),
      isLoading: true,
      error: false
    }

    this.ended = false
    this.cacheExisted = false
    this.source = this.props.sources ? RnCachedImage.getClosestHighQualitySource(
      this.props.sources,
      this.props.preferredPixelRatio,
    ) : null;
    if (!this.source) this.source = this.props.source
  }

  componentDidMount () {
    this.init()
  }

  // reset state from the beginning
  resetState = (callback) => {
    this.ended = false
    this.cacheExisted = false
    this.setState({
      opacity: new Animated.Value(0),
      holderSpinnerOpacity: new Animated.Value(1),
      holderSpinnerScale: new Animated.Value(1),
      isLoading: true,
      error: false
    }, callback)
  }

  startLoopAnimationForHolderSpinner = () => {
    if (!this.state.isLoading || !this.props.animationWhileLoading) return
    Animated.timing(this.state.holderSpinnerOpacity, {
      toValue: 0.25,
      duration: 400,
      useNativeDriver: true
    }).start(() => {
      Animated.timing(this.state.holderSpinnerOpacity, {
        toValue: 0.5,
        duration: 500,
        useNativeDriver: true
      }).start(this.startLoopAnimationForHolderSpinner)
    })
  };

  // when we use it in recycle listview, this component will not start over it's lifecycle
  // it just received new props and do some update instead
  componentWillReceiveProps (nextProps) {
    if (this.props.reuseView)
      this.resetState(this.init)
  }

  init() {
    if (this.props.shouldCachedImage) {
      this.download()
    } else {
      if (!this.source || !this.source.uri)
        this.setState({ error: true })
      else
        this.startLoopAnimationForHolderSpinner()
    }
  }

  async download () {
    const { uri } = this.source
    if (!uri) {
      this.onError()
      return
    }
    const path = getPath(uri, this.props.immutableCachedImage)
    this.cacheExisted = await cacheValid(path, this.props.maxAgeInHours)
    if (!this.cacheExisted) this.startLoopAnimationForHolderSpinner()
    else {
      console.log('[image caching] image existed', path)
      this.onDownloaded(path)
      return
    }
    console.log('[image caching] downloading ...', uri)
    if (!this.state.downloading) {
      RNFetchBlob.config({ path }).fetch('GET', uri, {}).then((res) => {
        const status = res.info().status
        if (status != 200) throw new Error('[image caching] downloading image failed')
        this.onDownloaded(path)
      }).catch(() => {
        console.log('[image caching] image download failed', uri)
        RNFetchBlob.fs.unlink(path)
        this.onError()
      })
    }
  }

  onDownloaded = (path) => !!path && this.setState({ path }, this.onLoadEnded)

  onLoadEnded = () => {
    if (this.ended) return
    this.ended = true
    if (!this.props.animationOnLoadEnd) {
      Animated.timing(this.state.opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        this.setState({
          isLoading: false
        })
      })
      return
    }
    this.getOnLoadEndAnimation().start(() => {
      this.setState({
        isLoading: false
      })
    })
  };

  getOnLoadEndAnimation = () => {
    const delay = this.cacheExisted ? 0 : this.props.delay
    switch (this.props.animationOnLoadEndType) {
      case animationTypes.ANIM_TYPE_FADE:
        return Animated.parallel([
          Animated.timing(this.state.holderSpinnerOpacity, {
            delay,
            duration: 100,
            toValue: 0,
            useNativeDriver: true
          }),
          Animated.timing(this.state.opacity, {
            delay,
            duration: 1000,
            toValue: 1,
            useNativeDriver: true
          })
        ])
      case animationTypes.ANIM_TYPE_SHRINK:
        return Animated.parallel([
          Animated.parallel([
            Animated.timing(this.state.holderSpinnerOpacity, {
              delay,
              duration: 200,
              toValue: 0,
              useNativeDriver: true
            }),
            Animated.timing(this.state.holderSpinnerScale, {
              delay,
              duration: 200,
              toValue: 0,
              useNativeDriver: true
            })
          ]),
          Animated.timing(this.state.opacity, {
            delay,
            duration: 300,
            toValue: 1,
            useNativeDriver: true
          })
        ])
      default: return Animated.sequence([
        Animated.parallel([
          Animated.timing(this.state.holderSpinnerScale, {
            delay,
            duration: 100,
            toValue: 0.7,
            useNativeDriver: true
          }),
          Animated.timing(this.state.holderSpinnerOpacity, {
            duration: 100,
            toValue: 0.66,
            useNativeDriver: true
          })
        ]),
        Animated.parallel([
          Animated.timing(this.state.holderSpinnerOpacity, {
            duration: 100,
            toValue: 0,
            useNativeDriver: true
          }),
          Animated.timing(this.state.holderSpinnerScale, {
            duration: 200,
            toValue: 1.3,
            useNativeDriver: true
          })
        ]),
        Animated.timing(this.state.opacity, {
          delay: 200,
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ])
    }
  }

  // on error will be trigged automatically via the Image component if shouldCachedImage equal false
  // on case we are using cache feature, it will be trigged only when download image failed
  onError = () => {
    if (this.props.onError) this.props.onError()
    if (this) this.setState({ error: true }, this.onLoadEnded)
  };

  render () {
    const { isLoading, shouldCachedImage } = this.state
    const { placeholderSource, placeholderColor } = this.props
    const source = this.getImageSource()
    if (this.state.error) return (
      <View
        style={[
          this.props.style,
          styles.errorWrapper
        ]}
      >
        <Image
          source={source}
          style={styles.errorImage}
        />
      </View>
    )

    return (
      <View>
        {isLoading &&
          <Animated.Image
            style={[
              this.props.style,
              {
                backgroundColor: placeholderColor,
                position: 'absolute',
                opacity: this.state.holderSpinnerOpacity,
                transform: [{ scale: this.state.holderSpinnerScale }]
              }
            ]}
          />
        }
        {source && source.uri ? <Animated.Image
          {...this.props}
          source={source}
          onLoadEnd={() => {
            if (this.props.shouldCachedImage) return
            this.onLoadEnded()
          }}
          onError={() => {
            if (this.props.shouldCachedImage) return
            this.onError()
          }}
          style={[this.props.style, { opacity: this.state.opacity }]}
        /> : null}
      </View>
    )
  }

  getImageSource = () => {
    let source
    if (this.state.error )
      source = this.props.errorPlaceholderSource ? this.props.errorPlaceholderSource : require('./assets/error-placeholder.png')
    else if (this.props.shouldCachedImage && this.state.path)
      source =  { uri: 'file://' + this.state.path }
    else source =  this.source
    return source
  }
}
