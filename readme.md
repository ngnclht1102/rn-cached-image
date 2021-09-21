# A react native cached, animated and auto chooses the best-resolution image for the current screen.
#### This is a simple react native image component that
- enable image caching (save to cache directory).
- add loading animation while the image is loading.
- add error placeholder if image loading has any errors.
- also wrap the https://github.com/expo/react-native-responsive-image so it can choose the correct image size for loading

## Installation
```
yarn add @ngnclht/rn-cached-image
```

Import it with:

```js
import RNCachedImage from ' @ngnclht/rn-cached-image';
```

## Demo: Loading animation and caching

![Loading animation and caching](demo/demo.gif)

## Demo: Loading failed:

![Error placeholder](demo/error-placeholder.png)

## Usage

RNCachedImage accepts the same props as Image, and some new props. 
For multiple sources, we have a new prop called `sources`. The `sources` prop is 
an object whose keys are pixel ratios (that is, screen scales like "2" or "3"). 
Its values are Image sources to display on screens with the respective pixel ratio.

#### Multiple sources:

```js
<RNCachedImage
  sources={{
    1: { uri: 'https://example.com/icon-1x.png' },
    2: { uri: 'https://example.com/icon-2x.png' },
    3: { uri: 'https://example.com/icon-3x.png' },
  }}
  // (optional) force ResponsiveImage to load a specified pixel ratio
  preferredPixelRatio={2}
/>
```
#### Caching

```js
  <RNCachedImage
    style={{ 
        // some style
    }}
    animationOnLoadEndType='fade' // we support 'shrink', 'explode' and 'fade'
    shouldCachedImage={true} //  to enable caching or not
    maxAgeInHours={72} // max age of the cache file, by default it is 72 hours (3 days)
    source={{ uri: localSource }} // if you don't like the multiple sources, just use this prop as usual 
    sources={{
        1: { uri: 'https://example.com/icon-1x.png' },
        2: { uri: 'https://example.com/icon-2x.png' },
        3: { uri: 'https://example.com/icon-3x.png' },
    }}
    animationWhileLoading={true} // enable animation while loading
    reuseView={true} // allow update the view
    placeholderColor={"#e0e5e5"} // animation's color for using while it is loading
    errorPlaceholderSource={require('./your-image.png')} // the image will be used to show user when image loading failed
  />
```




