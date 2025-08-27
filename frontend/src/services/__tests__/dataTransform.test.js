// frontend/src/services/__tests__/dataTransform.test.js
import { DataTransformService } from "../dataTransform";

describe("DataTransformService", () => {
  test("createHistogram creates correct bins", () => {
    const data = [1, 2, 2, 3, 3, 3, 4, 4, 5];
    const bins = DataTransformService.createHistogram(data, 5);

    expect(bins).toHaveLength(5);
    expect(bins.every((bin) => bin.hasOwnProperty("count"))).toBe(true);
    expect(bins.reduce((sum, bin) => sum + bin.count, 0)).toBe(data.length);
  });

  test("formatBytes formats correctly", () => {
    expect(DataTransformService.formatBytes(0)).toBe("0 Bytes");
    expect(DataTransformService.formatBytes(1024)).toBe("1 KB");
    expect(DataTransformService.formatBytes(1048576)).toBe("1 MB");
  });

  test("decimateData reduces points", () => {
    const data = Array(1000)
      .fill(0)
      .map((_, i) => i);
    const decimated = DataTransformService.decimateData(data, 100);

    expect(decimated.length).toBeLessThanOrEqual(100);
    expect(decimated[0]).toBe(0);
  });
});
