import { Image } from 'expo-image'
import { View, type StyleProp, type ViewStyle } from 'react-native'
import { BottleArt } from './BottleArt'

export function ProductImage({
  url,
  category,
  style,
}: {
  url: string | null | undefined
  category: string
  style?: StyleProp<ViewStyle>
}) {
  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style]}>
      {url ? (
        <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} contentFit="contain" transition={150} />
      ) : (
        <BottleArt category={category} width="80%" height="86%" />
      )}
    </View>
  )
}
