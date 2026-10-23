import Foundation
import ImageIO
import CoreGraphics
import UniformTypeIdentifiers

let root = URL(fileURLWithPath: CommandLine.arguments[1])
let pairs: [(String, String)] = [
  ("experience.jpg", "embeds/p05-011-1277x964.jpg"),
  ("hero.jpg", "embeds/p01-001-2552x2552.jpg"),
  ("africa.jpg", "embeds/p10-015-2561x2552.jpg"),
  ("asia-pacific.jpg", "embeds/p16-020-2561x2552.jpg"),
  ("latam.jpg", "embeds/p26-027-2561x2552.jpg"),
  ("europe.jpg", "embeds/p32-032-2561x2552.jpg"),
  ("far-east.jpg", "embeds/p36-036-2561x2552.jpg"),
  ("ship-diana.jpg", "embeds/p04-006-1347x600.jpg"),
  ("ship-vega.jpg", "embeds/p04-007-1347x600.jpg"),
  ("ship-minerva.jpg", "embeds/p04-008-1356x600.jpg"),
]

guard let srgb = CGColorSpace(name: CGColorSpace.sRGB) else {
  fputs("no srgb\n", stderr)
  exit(1)
}

for (outName, srcRel) in pairs {
  let src = root.appendingPathComponent(srcRel)
  guard let srcData = try? Data(contentsOf: src) as CFData,
        let source = CGImageSourceCreateWithData(srcData, [kCGImageSourceShouldCache: true] as CFDictionary),
        let cgImage = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
    fputs("fail read \(srcRel)\n", stderr)
    continue
  }

  let w = cgImage.width
  let h = cgImage.height
  let bitmapInfo = CGBitmapInfo.byteOrder32Big.rawValue | CGImageAlphaInfo.premultipliedLast.rawValue
  guard let ctx = CGContext(
    data: nil,
    width: w,
    height: h,
    bitsPerComponent: 8,
    bytesPerRow: 0,
    space: srgb,
    bitmapInfo: bitmapInfo
  ) else {
    fputs("fail ctx \(srcRel)\n", stderr)
    continue
  }

  ctx.draw(cgImage, in: CGRect(x: 0, y: 0, width: w, height: h))
  guard let outImage = ctx.makeImage() else { continue }

  let destURL = root.appendingPathComponent(outName) as CFURL
  guard let dest = CGImageDestinationCreateWithURL(destURL, UTType.jpeg.identifier as CFString, 1, nil) else { continue }
  CGImageDestinationAddImage(dest, outImage, [
    kCGImageDestinationLossyCompressionQuality: 0.92
  ] as CFDictionary)
  if CGImageDestinationFinalize(dest) {
    print("ok \(outName) \(w)x\(h)")
  } else {
    fputs("fail write \(outName)\n", stderr)
  }
}
