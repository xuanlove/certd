import { AbstractPlugin } from '../abstract-plugin/index.js'

export class AbstractAliyunPlugin extends AbstractPlugin {
  checkRet (ret) {
    if (ret.code != null) {
      throw new Error('执行失败：', ret.Message)
    }
  }
}
