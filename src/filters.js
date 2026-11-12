// Three-tone color treatments, interpolated by luminance. Alpha is preserved.
export const FILTERS = Object.freeze([
  { id: 'aurora', label: 'Aurora', colors: [[48, 25, 106], [179, 75, 221], [83, 224, 200]] },
  { id: 'solar', label: 'Solar', colors: [[103, 30, 50], [239, 91, 65], [255, 214, 112]] },
  { id: 'botanical', label: 'Botânico', colors: [[12, 58, 51], [34, 142, 100], [192, 232, 153]] },
  { id: 'cobalt', label: 'Cobalto', colors: [[14, 30, 79], [39, 101, 231], [174, 224, 255]] },
]);
