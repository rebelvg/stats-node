import { EnumProtocols } from './interfaces';

export function mapProtocol(protocolString: string): EnumProtocols {
  let protocol: EnumProtocols;

  switch (protocolString) {
    case 'rtmp':
      protocol = EnumProtocols.RTMP;

      break;
    case 'ws':
    case 'flv':
      protocol = EnumProtocols.FLV;

      break;
    case 'hls':
      protocol = EnumProtocols.HLS;

      break;
    case 'mpd':
      protocol = EnumProtocols.MPD;

      break;
    default:
      protocol = EnumProtocols.UNKNOWN;

      break;
  }

  return protocol;
}
