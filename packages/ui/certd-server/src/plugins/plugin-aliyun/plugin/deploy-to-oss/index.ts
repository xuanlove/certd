import { AbstractTaskPlugin, IsTaskPlugin, pluginGroups, RunStrategy, TaskInput } from '@certd/pipeline';
import { AliyunAccess } from '@certd/plugin-lib';
import { CertInfo } from '@certd/plugin-cert';
@IsTaskPlugin({
  name: 'DeployCertToAliyunOSS',
  title: '部署证书至阿里云OSS',
  icon: 'ant-design:aliyun-outlined',
  group: pluginGroups.aliyun.key,
  desc: '自动部署域名证书至阿里云OSS',
  default: {
    strategy: {
      runStrategy: RunStrategy.SkipWhenSucceed,
    },
  },
})
export class DeployCertToAliyunOSS extends AbstractTaskPlugin {
  @TaskInput({
    title: '大区',
    component: {
      name: 'a-auto-complete',
      vModel: 'value',
      options: [
        { value: 'oss-cn-hangzhou', label: '华东1（杭州）' },
        { value: 'oss-cn-shanghai', label: '华东2（上海）' },
        { value: 'oss-cn-nanjing', label: '华东5（南京-本地地域）' },
        { value: 'oss-cn-fuzhou', label: '华东6（福州-本地地域）' },
        { value: 'oss-cn-wuhan-lr', label: '华中1（武汉-本地地域）' },
        { value: 'oss-cn-qingdao', label: '华北1（青岛）' },
        { value: 'oss-cn-beijing', label: '华北2（北京）' },
        { value: 'oss-cn-zhangjiakou', label: '华北 3（张家口）' },
        { value: 'oss-cn-huhehaote', label: '华北5（呼和浩特）' },
        { value: 'oss-cn-wulanchabu', label: '华北6（乌兰察布）' },
        { value: 'oss-cn-shenzhen', label: '华南1（深圳）' },
        { value: 'oss-cn-heyuan', label: '华南2（河源）' },
        { value: 'oss-cn-guangzhou', label: '华南3（广州）' },
        { value: 'oss-cn-chengdu', label: '西南1（成都）' },
        { value: 'oss-cn-hongkong', label: '中国香港' },
        { value: 'oss-us-west-1', label: '美国（硅谷）①' },
        { value: 'oss-us-east-1', label: '美国（弗吉尼亚）①' },
        { value: 'oss-ap-northeast-1', label: '日本（东京）①' },
        { value: 'oss-ap-northeast-2', label: '韩国（首尔）' },
        { value: 'oss-ap-southeast-1', label: '新加坡①' },
        { value: 'oss-ap-southeast-2', label: '澳大利亚（悉尼）①' },
        { value: 'oss-ap-southeast-3', label: '马来西亚（吉隆坡）①' },
        { value: 'oss-ap-southeast-5', label: '印度尼西亚（雅加达）①' },
        { value: 'oss-ap-southeast-6', label: '菲律宾（马尼拉）' },
        { value: 'oss-ap-southeast-7', label: '泰国（曼谷）' },
        { value: 'oss-eu-central-1', label: '德国（法兰克福）①' },
        { value: 'oss-eu-west-1', label: '英国（伦敦）' },
        { value: 'oss-me-east-1', label: '阿联酋（迪拜）①' },
        { value: 'oss-rg-china-mainland', label: '无地域属性（中国内地）' },
      ],
    },
    required: true,
  })
  region!: string;

  @TaskInput({
    title: 'Bucket',
    helper: '存储桶名称',
    required: true,
  })
  bucket!: string;

  @TaskInput({
    title: '绑定的域名',
    helper: '你在阿里云OSS上绑定的域名，比如:certd.docmirror.cn',
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
  cert!: CertInfo;

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
    this.logger.info('开始部署证书到阿里云OSS');
    const access = (await this.accessService.getById(this.accessId)) as AliyunAccess;
    this.logger.info(`bucket: ${this.bucket}, region: ${this.region}, domainName: ${this.domainName}`);
    const client = await this.getClient(access);
    await this.doRequest(client, {});
    this.logger.info('部署完成');
  }

  async getClient(access: AliyunAccess) {
    // @ts-ignore
    const OSS = await import('ali-oss');
    return new OSS.default({
      accessKeyId: access.accessKeyId,
      accessKeySecret: access.accessKeySecret,
      // yourRegion填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
      region: this.region,
      //@ts-ignore
      authorizationV4: true,
      // yourBucketName填写Bucket名称。
      bucket: this.bucket,
    });
  }

  async doRequest(client: any, params: any) {
    params = client._bucketRequestParams('POST', this.bucket, {
      cname: '',
      comp: 'add',
    });
    const xml = `
 <BucketCnameConfiguration>
  <Cname>
    <Domain>${this.domainName}</Domain>
    <CertificateConfiguration>
      <PrivateKey>${this.cert.key}</PrivateKey>
      <Certificate>${this.cert.crt}</Certificate>
    </CertificateConfiguration>
  </Cname>
</BucketCnameConfiguration>`;
    params.content = xml;
    params.mime = 'xml';
    params.successStatuses = [200];
    const res = await client.request(params);
    this.checkRet(res);
    return res;
  }

  checkRet(ret: any) {
    if (ret.code != null) {
      throw new Error('执行失败：' + ret.Message);
    }
  }
}
new DeployCertToAliyunOSS();
