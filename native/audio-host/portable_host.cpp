#include "audio_host.hpp"

namespace dbstudio::host {

HostStatus PortableHost::status() const {
  return {Backend::Portable, false, false, 48000, 128, 0,
          "portable fallback: no native low-latency device"};
}

bool PortableHost::start() { return false; }

void PortableHost::stop() {}

}  // namespace dbstudio::host
