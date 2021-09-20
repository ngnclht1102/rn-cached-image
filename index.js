/**
* Image component:
* we have 2 modes: download and cache the image and not cache as usual
* we apply some animation when image is still fetching (spinner)
* we also apply some animation when image is loaded as well.
**/
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import RNFetchBlob from 'react-native-fetch-blob'
import { Animated, Image, View } from 'react-native'
import { getPath } from './utils'
import animationTypes from './animation.type'

export default class RnCachedImage extends Component {
  static propTypes = {
    style: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.array,
      PropTypes.object
    ]),
    onLoad: PropTypes.func,
    onError: PropTypes.func,
    source: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
    placeholderSource: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
    errorPlaceholderSource: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
    animationWhileLoading: PropTypes.bool, // if disable animation on load, it will show the placeholderSource on load
    animationOnLoadEnd: PropTypes.bool, // if disable animation on load, it will show the placeholderSource on load
    animationOnLoadEndType: PropTypes.string, // one of explode, fade, shrink
    placeholderColor: PropTypes.string, // one of explode, fade, shrink
    shouldCachedImage: PropTypes.bool, // only applied when should cache image is enable
    immutableCachedImage: PropTypes.bool, // only applied when should cache image is enable
    delay: PropTypes.number // increase the loading time by miliseconds
  };

  static defaultProps = {
    animationWhileLoading: true,
    animationOnLoadEnd: true,
    animationOnLoadEndType: animationTypes.ANIM_TYPE_SHRINK,
    placeholderColor: 'gray',
    shouldCachedImage: false,
    immutableCachedImage: true,
    delay: 500
  };

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
    this.imageExisted = false
  }

  componentDidMount () {
    if (this.props.shouldCachedImage) { this.download() } else { this.startLoopAnimationForHolderSpinner() }
  }

  // reset state from the beginning
  resetState = (callback) => {
    this.ended = false
    this.imageExisted = false
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
      toValue: 0.4,
      duration: 400,
      useNativeDriver: true
    }).start(() => {
      Animated.timing(this.state.holderSpinnerOpacity, {
        toValue: 0.9,
        duration: 500,
        useNativeDriver: true
      }).start(this.startLoopAnimationForHolderSpinner)
    })
  };

  // when we use it in recycle listview, this component will not start over it's lifecycle
  // it just received new props and do some update instead
  componentWillReceiveProps (nextProps) {
    this.resetState(() => {
      if (this.props.shouldCachedImage) {
        this.download()
      } else {
        this.startLoopAnimationForHolderSpinner()
      }
    })
  }

  async download () {
    const { uri } = this.props.source
    if (!uri) return
    const path = getPath(uri, this.props.immutableCachedImage)
    this.imageExisted = await RNFetchBlob.fs.exists(path)
    if (!this.imageExisted) this.startLoopAnimationForHolderSpinner()
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

  onDownloaded = (path) => this.setState({ path }, this.onLoadEnded)

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
    const delay = this.imageExisted ? 0 : this.props.delay
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
    return (
      <View>
        {(isLoading || (!placeholderSource && this.state.error)) && (
          <Animated.View
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
        )}
        <Animated.Image
          {...this.props}
          source={this.getImageSource()}
          onLoadEnd={() => {
            if (this.props.shouldCachedImage) return
            this.onLoadEnded()
          }}
          onError={() => {
            if (this.props.shouldCachedImage) return
            this.onError()
          }}
          style={[this.props.style, { opacity: this.state.opacity }]}
        />
      </View>
    )
  }

  getImageSource = () => {
    if (this.state.error && this.props.placeholderSource) { return this.props.placeholderSource }
    if (this.props.shouldCachedImage) { return { uri: 'file://' + this.state.path } }
    return this.props.source
  }
}
