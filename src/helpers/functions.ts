import { WEB_DEFAULT_PROTOCOL, WEB_DEFAULT_APP, WEB_URL } from '../config';
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

export function generateURLs({
  channel,
  protocol,
  app,
  origin,
}: {
  channel: string;
  protocol: EnumProtocols;
  app: string;
  origin: string;
}) {
  const webBase = `${WEB_URL}/${channel}`;

  let web = webBase;

  let webProtocol = protocol;

  if (protocol === EnumProtocols.RTMP) {
    webProtocol = EnumProtocols.FLV;
  }

  if (WEB_DEFAULT_APP !== app) {
    web = `${web}/${webProtocol}/${app}`;
  } else {
    if (WEB_DEFAULT_PROTOCOL !== webProtocol) {
      web = `${web}/${webProtocol}`;
    }
  }

  switch (protocol) {
    case EnumProtocols.RTMP:
      return {
        web,
        edge: `${origin}/${app}/${channel}`,
      };
    case EnumProtocols.FLV:
      return {
        web,
        edge: `${origin}/${app}/${channel}.flv`,
      };
    case EnumProtocols.HLS:
      return {
        web,
        edge: `${origin}/channels/${channel}/${app}/index.m3u8`,
      };
    case EnumProtocols.MPD:
      return {
        web,
        edge: `${origin}/channels/${channel}/${app}/index.mpd`,
      };
    default:
      return null;
  }
}
