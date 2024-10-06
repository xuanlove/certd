import { AbstractTaskPlugin, IsTaskPlugin, pluginGroups, RunStrategy, TaskInput } from '@certd/pipeline';
import dayjs from 'dayjs';
import { AliyunAccess, AliyunClient } from "@certd/plugin-plus";
@IsTaskPlugin({
  name: 'DeployCertToAliyunCDN',
  title: '部署证书至阿里云CDN',
  icon: 'ant-design:aliyun-outlined',
  group: pluginGroups.aliyun.key,
  desc: '自动部署域名证书至阿里云CDN',
  default: {
    strategy: {
      runStrategy: RunStrategy.SkipWhenSucceed,
    },
  },
})
export class DeployCertToAliyunCDN extends AbstractTaskPlugin {
  @TaskInput({
    title: 'CDN加速域名',
    helper: '你在阿里云上配置的CDN加速域名，比如:certd.docmirror.cn',
    required: true,
  })
  domainName!: string;

  @TaskInput({
    title: '证书名称',
    helper: '上传后将以此名称作为前缀备注',
  })
  certName!: string;

  @TaskInput({
    title: '域名证书',
    helper: '请选择前置任务输出的域名证书',
    component: {
      name: 'output-selector',
      from: ['CertApply', 'CertApplyLego'],
    },
    required: true,
  })
  cert!: string;

  @TaskInput({
    title: 'Access授权',
    helper: '阿里云授权AccessKeyId、AccessKeySecret',
    component: {
      name: 'access-selector',
      type: 'aliyun',
    },
    required: true,
  })
  accessId!: string;

  async onInstance() {}
  async execute(): Promise<void> {
    this.logger.info('开始部署证书到阿里云cdn');
    const access = (await this.accessService.getById(this.accessId)) as AliyunAccess;
    const client = await this.getClient(access);
    const params = await this.buildParams();
    await this.doRequest(client, params);
    this.logger.info('部署完成');
  }

  async getClient(access: AliyunAccess) {
    const client = new AliyunClient({logger:this.logger})
    await client.init({
      accessKeyId: access.accessKeyId,
      accessKeySecret: access.accessKeySecret,
      endpoint: 'https://cdn.aliyuncs.com',
      apiVersion: '2018-05-10',
    })
    return client
  }

  async buildParams() {
    const CertName = (this.certName ?? 'certd') + '-' + dayjs().format('YYYYMMDDHHmmss');
    const cert: any = this.cert;
    return {
      DomainName: this.domainName,
      SSLProtocol: 'on',
      CertName: CertName,
      CertType: 'upload',
      SSLPub: cert.crt,
      SSLPri: cert.key,
    };
  }

  async doRequest(client: any, params: any) {
    const requestOption = {
      method: 'POST',
    };
    const ret: any = await client.request('SetCdnDomainSSLCertificate', params, requestOption);
    this.checkRet(ret);
    this.logger.info('设置cdn证书成功:', ret.RequestId);
  }

  checkRet(ret: any) {
    if (ret.code != null) {
      throw new Error('执行失败：' + ret.Message);
    }
  }
}
new DeployCertToAliyunCDN();
