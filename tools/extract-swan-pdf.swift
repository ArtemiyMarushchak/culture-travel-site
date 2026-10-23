#!/usr/bin/env swift
import Foundation
import PDFKit
import AppKit
import ImageIO
import UniformTypeIdentifiers

let root = URL(fileURLWithPath: CommandLine.arguments.count > 1
  ? CommandLine.arguments[1]
  : FileManager.default.currentDirectoryPath)
let pdfURL = root.appendingPathComponent("content/cruises/_src/swan-hellenic.pdf")
let outDir = root.appendingPathComponent("assets/images/cruises")
let pagesDir = outDir.appendingPathComponent("pages")
let embedsDir = outDir.appendingPathComponent("embeds")

try FileManager.default.createDirectory(at: pagesDir, withIntermediateDirectories: true)
try FileManager.default.createDirectory(at: embedsDir, withIntermediateDirectories: true)

guard let doc = PDFDocument(url: pdfURL) else {
  fputs("Cannot open PDF: \(pdfURL.path)\n", stderr)
  exit(1)
}

print("pages=\(doc.pageCount)")

// Key spreads for magazine: cover, intro, ships, region openers, sample itineraries
let keyPages: [Int] = [
  0, 1, 3, 4, 5, 7, 9, 11, 13, 15, 17, 21, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43
].filter { $0 < doc.pageCount }

func saveJPEG(_ image: CGImage, to url: URL, quality: CGFloat = 0.86) -> Bool {
  guard let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.jpeg.identifier as CFString, 1, nil) else {
    return false
  }
  let opts: [CFString: Any] = [kCGImageDestinationLossyCompressionQuality: quality]
  CGImageDestinationAddImage(dest, image, opts as CFDictionary)
  return CGImageDestinationFinalize(dest)
}

var rendered = 0
for index in keyPages {
  guard let page = doc.page(at: index) else { continue }
  let bounds = page.bounds(for: .mediaBox)
  let scale: CGFloat = 1.6
  let w = Int(bounds.width * scale)
  let h = Int(bounds.height * scale)
  guard w > 0, h > 0 else { continue }

  let colorSpace = CGColorSpaceCreateDeviceRGB()
  guard let ctx = CGContext(
    data: nil,
    width: w,
    height: h,
    bitsPerComponent: 8,
    bytesPerRow: 0,
    space: colorSpace,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
  ) else { continue }

  ctx.setFillColor(NSColor.white.cgColor)
  ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
  ctx.saveGState()
  ctx.translateBy(x: 0, y: CGFloat(h))
  ctx.scaleBy(x: scale, y: -scale)
  page.draw(with: .mediaBox, to: ctx)
  ctx.restoreGState()

  guard let cgImage = ctx.makeImage() else { continue }
  let name = String(format: "page-%02d.jpg", index + 1)
  let url = pagesDir.appendingPathComponent(name)
  if saveJPEG(cgImage, to: url) {
    rendered += 1
    print("page \(index + 1) -> \(name) \(w)x\(h)")
  }
}

// Extract embedded XObject images via CGPDF
guard let provider = CGDataProvider(url: pdfURL as CFURL),
      let cgDoc = CGPDFDocument(provider) else {
  print("embed skip: no CGPDF")
  exit(0)
}

var embedCount = 0
var seen = Set<String>()

func hashBytes(_ data: Data) -> String {
  // cheap fingerprint
  var h: UInt64 = 5381
  for b in data.prefix(4096) { h = ((h << 5) &+ h) &+ UInt64(b) }
  h = ((h << 5) &+ h) &+ UInt64(data.count)
  return String(h, radix: 16)
}

for pageIndex in 1...cgDoc.numberOfPages {
  guard let page = cgDoc.page(at: pageIndex),
        let dict = page.dictionary else { continue }
  var resources: CGPDFDictionaryRef?
  guard CGPDFDictionaryGetDictionary(dict, "Resources", &resources),
        let resources else { continue }
  var xObject: CGPDFDictionaryRef?
  guard CGPDFDictionaryGetDictionary(resources, "XObject", &xObject),
        let xObject else { continue }

  CGPDFDictionaryApplyBlock(xObject, { key, object, _ in
    var stream: CGPDFStreamRef?
    guard CGPDFObjectGetValue(object, .stream, &stream), let stream else { return true }
    guard let streamDict = CGPDFStreamGetDictionary(stream) else { return true }
    var subtype: UnsafePointer<CChar>?
    guard CGPDFDictionaryGetName(streamDict, "Subtype", &subtype),
          let subtype, String(cString: subtype) == "Image" else { return true }

    var width: CGPDFInteger = 0
    var height: CGPDFInteger = 0
    CGPDFDictionaryGetInteger(streamDict, "Width", &width)
    CGPDFDictionaryGetInteger(streamDict, "Height", &height)
    // Skip icons / UI chrome
    if width < 600 || height < 400 { return true }

    var format = CGPDFDataFormat.raw
    guard let cfData = CGPDFStreamCopyData(stream, &format) as Data? else { return true }
    let fp = hashBytes(cfData)
    if seen.contains(fp) { return true }
    seen.insert(fp)

    embedCount += 1
    let base = String(format: "p%02d-%03d-%dx%d", pageIndex, embedCount, width, height)

    switch format {
    case .jpegEncoded:
      let url = embedsDir.appendingPathComponent("\(base).jpg")
      try? cfData.write(to: url)
      print("embed \(base).jpg")
    case .JPEG2000:
      let url = embedsDir.appendingPathComponent("\(base).jp2")
      try? cfData.write(to: url)
      print("embed \(base).jp2")
    default:
      // Try to interpret as PNG or leave raw skipped if tiny
      if cfData.starts(with: [0x89, 0x50, 0x4E, 0x47]) {
        let url = embedsDir.appendingPathComponent("\(base).png")
        try? cfData.write(to: url)
        print("embed \(base).png")
      } else {
        print("skip raw \(base) format=\(format.rawValue) bytes=\(cfData.count)")
      }
    }
    return true
  }, nil)
}

print("done rendered=\(rendered) embeds=\(embedCount)")
